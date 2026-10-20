import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const dest = path.resolve("runtime");
const marker = path.join(dest, "prompt_runtime.py");
if (fs.existsSync(marker)) {
  console.log("personality runtime present");
  process.exit(0);
}
fs.rmSync(dest, { recursive: true, force: true });
execSync(
  "git clone --depth 1 https://github.com/DDLP-max/moodybot-telegram.git runtime",
  { stdio: "inherit" }
);
if (!fs.existsSync(marker)) {
  console.error("personality runtime checkout did not include prompt_runtime.py");
  process.exit(1);
}
