import { rm } from "node:fs/promises";
import { getTargetDir, dirExists } from "../utils.mjs";

export async function uninstall() {
  const target = getTargetDir();

  if (!(await dirExists(target))) {
    console.log("Skill is not installed.");
    return;
  }

  await rm(target, { recursive: true, force: true });
  console.log(`Removed ${target}`);
}
