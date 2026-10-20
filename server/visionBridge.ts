import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "web_vision.py");

export type VisionImage = { mime: string; base64: string };

export type VisionPrepare = {
  ok: boolean;
  error?: string;
  hasImages?: boolean;
  fresh?: boolean;
  intent?: string;
  recordIds?: string[];
  reply?: string;
  anchor?: string;
};

function pythonCommand(): { cmd: string; args: string[] } {
  if (process.env.MOODYBOT_PYTHON) {
    return { cmd: process.env.MOODYBOT_PYTHON, args: [script] };
  }
  if (process.platform === "win32") {
    return { cmd: "py", args: ["-3.12", script] };
  }
  return { cmd: "python3", args: [script] };
}

export function runVision(payload: Record<string, unknown>): Promise<VisionPrepare> {
  const { cmd, args } = pythonCommand();
  return new Promise((resolve, reject) => {
    const runtime = process.env.MOODYBOT_RUNTIME
      || path.resolve(path.dirname(script), "..", "..", "_render_src");
    const child = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: fs.existsSync(runtime) ? runtime : undefined,
    });
    let out = "";
    let err = "";
    child.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      err += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      try {
        const parsed = JSON.parse(out || "{}");
        if (code !== 0 && !parsed.error) {
          reject(new Error(err.trim() || "Vision pipeline failed"));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error(err.trim() || "Vision pipeline returned nothing"));
      }
    });
    child.stdin.end(JSON.stringify(payload));
  });
}

export function splitAnchor(raw: string): { spoken: string; anchor: string } {
  const pattern = /^\s*ANCHOR:\s*(.+?)\s*$/gim;
  const found: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(raw))) {
    if (match[1].trim()) found.push(match[1].trim());
  }
  const spoken = raw.replace(/^\s*ANCHOR:\s*.+$/gim, "").trim();
  return { spoken, anchor: found.join(" ") };
}
