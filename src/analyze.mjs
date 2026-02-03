import { readFile, readdir, stat } from "node:fs/promises";
import { join, extname } from "node:path";

/**
 * Programmatic analysis functions — a subset of Phase 1 logic
 * from the project-setup skill, made executable as code.
 */

/**
 * Detect manifest files in a directory.
 * Returns array of { file, type } objects.
 */
export async function detectManifests(dir) {
  const manifests = [
    { pattern: "package.json", type: "node" },
    { pattern: "pyproject.toml", type: "python" },
    { pattern: "setup.py", type: "python" },
    { pattern: "requirements.txt", type: "python" },
    { pattern: "Cargo.toml", type: "rust" },
    { pattern: "go.mod", type: "go" },
    { pattern: "pom.xml", type: "java" },
    { pattern: "build.gradle", type: "java" },
    { pattern: "Gemfile", type: "ruby" },
    { pattern: "mix.exs", type: "elixir" },
    { pattern: "composer.json", type: "php" },
    { pattern: "pubspec.yaml", type: "dart" },
  ];

  const found = [];
  for (const m of manifests) {
    try {
      await stat(join(dir, m.pattern));
      found.push({ file: m.pattern, type: m.type });
    } catch {
      // Not found
    }
  }
  return found;
}

/**
 * Count files recursively in a directory.
 * Skips node_modules, .git, __pycache__, etc.
 */
export async function countFiles(dir, skipDirs = null) {
  const skip = skipDirs || new Set([
    "node_modules", ".git", "__pycache__", ".next", ".nuxt",
    "dist", "build", ".cache", "vendor", "target",
  ]);

  let count = 0;
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (skip.has(entry.name)) continue;
        count += await countFiles(join(dir, entry.name), skip);
      } else {
        count++;
      }
    }
  } catch {
    // Permission or access error
  }
  return count;
}

/**
 * Determine project size category from file count.
 */
export function categorizeSize(fileCount) {
  if (fileCount < 100) return "small";
  if (fileCount <= 500) return "medium";
  return "large";
}

/**
 * Detect formatters and linters present in a directory.
 */
export async function detectTooling(dir) {
  const tools = [];
  const checks = [
    { files: [".prettierrc", ".prettierrc.json", ".prettierrc.js", ".prettierrc.mjs"], name: "prettier" },
    { files: ["eslint.config.js", "eslint.config.mjs", ".eslintrc.json", ".eslintrc.js"], name: "eslint" },
    { files: ["biome.json", "biome.jsonc"], name: "biome" },
    { files: ["ruff.toml"], name: "ruff" },
    { files: [".pylintrc", "pylintrc"], name: "pylint" },
    { files: [".editorconfig"], name: "editorconfig" },
    { files: ["jest.config.js", "jest.config.ts", "jest.config.mjs"], name: "jest" },
    { files: ["vitest.config.js", "vitest.config.ts", "vitest.config.mjs"], name: "vitest" },
    { files: ["pytest.ini", "conftest.py"], name: "pytest" },
    { files: ["tsconfig.json"], name: "typescript" },
  ];

  for (const check of checks) {
    for (const file of check.files) {
      try {
        await stat(join(dir, file));
        tools.push(check.name);
        break;
      } catch {
        // Not found
      }
    }
  }

  return tools;
}

/**
 * Detect key directories present in a project.
 */
export async function detectDirectories(dir) {
  const interesting = [
    "src", "lib", "app", "tests", "test", "__tests__", "spec",
    "api", "routes", "endpoints", "components", "pages", "views",
    "migrations", "prisma", "docker", ".github", ".gitlab-ci.yml",
    "docs", ".claude", "skills", "agents",
  ];

  const found = [];
  for (const name of interesting) {
    try {
      const s = await stat(join(dir, name));
      if (s.isDirectory()) found.push(name);
    } catch {
      // Not found
    }
  }
  return found;
}

/**
 * Read and parse a package.json if it exists.
 */
export async function readPackageJson(dir) {
  try {
    const content = await readFile(join(dir, "package.json"), "utf8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

/**
 * Build a project analysis summary.
 */
export async function analyzeProject(dir) {
  const manifests = await detectManifests(dir);
  const fileCount = await countFiles(dir);
  const size = categorizeSize(fileCount);
  const tooling = await detectTooling(dir);
  const directories = await detectDirectories(dir);
  const pkg = await readPackageJson(dir);

  const frameworks = [];
  if (pkg) {
    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };
    const knownFrameworks = [
      "react", "next", "vue", "nuxt", "svelte", "angular",
      "express", "fastify", "hono", "koa",
      "django", "flask", "fastapi",
      "tailwindcss", "@tailwindcss/postcss",
    ];
    for (const fw of knownFrameworks) {
      if (allDeps[fw]) frameworks.push(fw);
    }
  }

  const projectTypes = [...new Set(manifests.map((m) => m.type))];

  return {
    dir,
    manifests,
    projectTypes,
    fileCount,
    size,
    tooling,
    directories,
    frameworks,
    packageJson: pkg ? { name: pkg.name, version: pkg.version, scripts: pkg.scripts } : null,
  };
}

/**
 * Generate a basic CLAUDE.md content from an analysis result.
 * Returns markdown string.
 */
export function generateClaudeMd(analysis) {
  const lines = [];

  // Project Overview
  lines.push("### Project Overview");
  lines.push("");
  if (analysis.packageJson?.name) {
    lines.push(`${analysis.packageJson.name}${analysis.packageJson.version ? ` (v${analysis.packageJson.version})` : ""}`);
  }
  if (analysis.projectTypes.length > 0) {
    lines.push(`**Type:** ${analysis.projectTypes.join(", ")}`);
  }
  if (analysis.frameworks.length > 0) {
    lines.push(`**Frameworks:** ${analysis.frameworks.join(", ")}`);
  }
  lines.push(`**Size:** ${analysis.size} (${analysis.fileCount} files)`);
  lines.push("");

  // Build & Run
  if (analysis.packageJson?.scripts) {
    lines.push("### Build & Run Commands");
    lines.push("");
    lines.push("```bash");
    for (const [name, cmd] of Object.entries(analysis.packageJson.scripts)) {
      lines.push(`# ${name}`);
      lines.push(`npm run ${name}`);
    }
    lines.push("```");
    lines.push("");
  }

  // Tooling
  if (analysis.tooling.length > 0) {
    lines.push("### Code Style");
    lines.push("");
    lines.push(`Detected tools: ${analysis.tooling.join(", ")}`);
    lines.push("");
  }

  // Directory structure
  if (analysis.directories.length > 0) {
    lines.push("### Project Structure");
    lines.push("");
    for (const d of analysis.directories) {
      lines.push(`- \`${d}/\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Simple diff of two strings.
 * Returns array of { type: 'add'|'remove'|'same', line } objects.
 */
export function diffStrings(oldStr, newStr) {
  const oldLines = oldStr.split("\n");
  const newLines = newStr.split("\n");
  const result = [];

  // Simple line-by-line comparison (not a full diff algorithm)
  const maxLen = Math.max(oldLines.length, newLines.length);
  const oldSet = new Set(oldLines);
  const newSet = new Set(newLines);

  // Lines only in new
  const additions = newLines.filter((l) => !oldSet.has(l));
  // Lines only in old
  const removals = oldLines.filter((l) => !newSet.has(l));

  for (const line of removals) {
    result.push({ type: "remove", line });
  }
  for (const line of additions) {
    result.push({ type: "add", line });
  }

  return result;
}
