import {
  getTargetDir,
  getPackageSkillsDir,
  copyDir,
  dirExists,
  listFiles,
  promptYesNo,
} from "../utils.mjs";

export async function install(flags) {
  const target = getTargetDir();
  const source = getPackageSkillsDir();

  if (await dirExists(target)) {
    if (!flags.force) {
      const ok = await promptYesNo("Skill already installed. Overwrite?");
      if (!ok) {
        console.log("Aborted.");
        return;
      }
    }
  }

  await copyDir(source, target);

  const files = await listFiles(target);
  console.log(`Installed ${files.length} files to ${target}`);
  for (const f of files) {
    console.log(`  ${f}`);
  }
}
