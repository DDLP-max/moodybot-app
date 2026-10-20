import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

function visionScript(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, "web_vision.py"),
    path.resolve(here, "..", "server", "web_vision.py"),
  ];
  return candidates.find((file) => fs.existsSync(file)) || candidates[0];
}

function runtimeDir(scriptPath: string): string | undefined {
  const candidates = [
    process.env.MOODYBOT_RUNTIME,
    path.resolve(process.cwd(), "runtime"),
    path.resolve(path.dirname(scriptPath), "..", "runtime"),
    path.resolve(path.dirname(scriptPath), "..", "..", "runtime"),
    path.resolve(path.dirname(scriptPath), "..", "..", "_render_src"),
    path.resolve(path.dirname(scriptPath), "..", "_render_src"),
  ].filter((value): value is string => Boolean(value));
  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (fs.existsSync(path.join(resolved, "prompt_runtime.py"))) return resolved;
  }
  return undefined;
}

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

function pythonCommand(scriptPath: string): { cmd: string; args: string[] } {
  if (process.env.MOODYBOT_PYTHON) {
    return { cmd: process.env.MOODYBOT_PYTHON, args: [scriptPath] };
  }
  if (process.platform === "win32") {
    return { cmd: "py", args: ["-3.12", scriptPath] };
  }
  return { cmd: "python3", args: [scriptPath] };
}

export function runVision(payload: Record<string, unknown>): Promise<VisionPrepare> {
  const scriptPath = visionScript();
  if (!fs.existsSync(scriptPath)) {
    return Promise.resolve({
      ok: false,
      error: "The image reader isn't on this server.",
    });
  }
  const { cmd, args } = pythonCommand(scriptPath);
  const runtime = runtimeDir(scriptPath);
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: runtime || process.cwd(),
      env: {
        ...process.env,
        MOODYBOT_RUNTIME: runtime || process.env.MOODYBOT_RUNTIME || "",
        PYTHONPATH: [path.resolve(process.cwd(), "pydeps"), process.env.PYTHONPATH || ""]
          .filter(Boolean)
          .join(path.delimiter),
      },
    });
    let out = "";
    let settled = false;
    const finish = (result: VisionPrepare) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    child.stdout.on("data", (chunk) => {
      out += chunk.toString();
    });
    child.stderr.on("data", () => {});
    child.stdin.on("error", () => {});
    child.on("error", () => {
      finish({ ok: false, error: "The image reader isn't on this server." });
    });
    child.on("close", (code) => {
      try {
        const parsed = JSON.parse(out || "{}");
        if (code !== 0 && !parsed.error) {
          finish({ ok: false, error: "Could not read that image." });
          return;
        }
        finish(parsed);
      } catch {
        finish({ ok: false, error: "Could not read that image." });
      }
    });
    try {
      child.stdin.end(JSON.stringify(payload));
    } catch {
      finish({ ok: false, error: "Could not read that image." });
    }
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
