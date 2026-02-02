import { join } from "node:path";
import { getTargetDir, getPackageSkillsDir, dirExists, listFiles } from "../utils.mjs";

export async function status() {
  const target = getTargetDir();

  if (!(await dirExists(target))) {
    console.log("Status: not installed");
    return;
  }

  const installedFiles = await listFiles(target);
  const bundledFiles = await listFiles(getPackageSkillsDir());

  const installedSet = new Set(installedFiles);
  const bundledSet = new Set(bundledFiles);

  const missing = bundledFiles.filter((f) => !installedSet.has(f));
  const extra = installedFiles.filter((f) => !bundledSet.has(f));

  if (missing.length === 0 && extra.length === 0) {
    console.log("Status: installed");
  } else {
    console.log("Status: outdated");
    if (missing.length > 0) {
      console.log(`  Missing: ${missing.join(", ")}`);
    }
    if (extra.length > 0) {
      console.log(`  Extra:   ${extra.join(", ")}`);
    }
  }

  console.log(`Path: ${target}`);
  console.log(`Files: ${installedFiles.length}`);

  // Report template count
  const templatesDir = join(target, "templates");
  if (await dirExists(templatesDir)) {
    const templateFiles = await listFiles(templatesDir);
    const templateCount = templateFiles.filter(
      (f) => f.endsWith(".md") && f !== "_index.md"
    ).length;
    console.log(`Templates: ${templateCount}`);
  }
}
