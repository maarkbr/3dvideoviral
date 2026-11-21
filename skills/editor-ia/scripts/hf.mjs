#!/usr/bin/env node
// HyperFrames CLI for the editor-ia skill. Finds the HyperFrames install and forwards the command:
//   1. the Claude Code plugin (~/.claude/plugins/cache/hyperframes/hyperframes/<version>) — through its launcher,
//      so every machine runs the exact CLI version the plugin ships with;
//   2. standalone skills (`npx hyperframes skills` → ~/.claude/skills/hyperframes, media-use, hyperframes-audio…);
//   3. nothing installed → `npx --yes hyperframes@latest` (render/check work; no SFX library, no carve).
//
//   node hf.mjs <cli args...>                     e.g. node hf.mjs check   |   node hf.mjs render . --fps 30 -o out.mp4
//   node hf.mjs --skill-script <path> [args...]  a helper inside the skills dir,
//                                                e.g. node hf.mjs --skill-script hyperframes-audio/scripts/carve.mjs --comp index.html
//   node hf.mjs --version                         prints the HyperFrames version (to pin @hyperframes/core)
//   node hf.mjs --where                           prints the skills directory (plugin or standalone)
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const home = os.homedir();
const base = path.join(home, ".claude", "plugins", "cache", "hyperframes", "hyperframes");
const cmp = (a, b) => {
  const pa = a.split(/[.-]/).map((v) => parseInt(v, 10) || 0), pb = b.split(/[.-]/).map((v) => parseInt(v, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0);
  return 0;
};
let version = null, skills = null, launcher = null;
if (fs.existsSync(base)) {
  const versions = fs.readdirSync(base).filter((v) => fs.existsSync(path.join(base, v, "skills", "hyperframes", "scripts", "plugin-cli.mjs"))).sort(cmp);
  if (versions.length) {
    version = versions[versions.length - 1];
    skills = path.join(base, version, "skills");
    launcher = path.join(skills, "hyperframes", "scripts", "plugin-cli.mjs");
  }
}
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
const run = (cmd, cargs) => spawnSync(cmd, cargs, { stdio: "inherit", shell: process.platform === "win32" && cmd.endsWith(".cmd") });
if (!skills) {
  for (const d of [path.join(home, ".claude", "skills"), path.join(home, ".agents", "skills")]) {
    if (fs.existsSync(path.join(d, "hyperframes", "SKILL.md"))) { skills = d; break; }
  }
}
const args = process.argv.slice(2);
if (args[0] === "--version") {
  if (version) { console.log(version); process.exit(0); }
  const r = spawnSync(npx, ["--yes", "hyperframes@latest", "--version"], { encoding: "utf-8", shell: process.platform === "win32" });
  const m = /(\d+\.\d+\.\d+)/.exec((r.stdout || "") + (r.stderr || ""));
  if (!m) { console.error("HyperFrames não encontrado"); process.exit(2); }
  console.log(m[1]);
  process.exit(0);
}
if (args[0] === "--where") {
  if (!skills) { console.error("HyperFrames não instalado (nem plugin, nem skills avulsas)"); process.exit(2); }
  console.log(skills);
  process.exit(0);
}
let r;
if (args[0] === "--skill-script") {
  if (!skills) {
    console.error("O HyperFrames não está instalado. Instale o plugin:\n  claude plugin marketplace add heygen-com/hyperframes\n  claude plugin install hyperframes@hyperframes\nou as skills avulsas:  npx hyperframes skills");
    process.exit(2);
  }
  const script = path.join(skills, args[1]);
  r = launcher ? run(process.execPath, [launcher, "--script", script, ...args.slice(2)]) : run(process.execPath, [script, ...args.slice(2)]);
} else if (launcher) {
  r = run(process.execPath, [launcher, ...args]);
} else {
  r = run(npx, ["--yes", "hyperframes@latest", ...args]);
}
process.exit(r.status == null ? 1 : r.status);
