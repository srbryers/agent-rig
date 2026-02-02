import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { stat, cp, readdir } from "node:fs/promises";
import { createInterface } from "node:readline";

const __dirname = dirname(fileURLToPath(import.meta.url));

export function getSkillsDir() {
  return join(homedir(), ".claude", "skills");
}

export function getTargetDir() {
  return join(getSkillsDir(), "project-setup");
}

export function getPackageSkillsDir() {
  return join(__dirname, "..", "skills", "project-setup");
}

export async function copyDir(src, dest) {
  await cp(src, dest, { recursive: true });
}

export async function dirExists(p) {
  try {
    const s = await stat(p);
    return s.isDirectory();
  } catch {
    return false;
  }
}

export async function listFiles(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(join(dir, entry.name), rel)));
    } else {
      files.push(rel);
    }
  }
  return files;
}

export function promptYesNo(question) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question(`${question} (y/N) `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}
