import { readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Returns the path to the bundled templates directory.
 */
export function getTemplatesDir() {
  return join(__dirname, "..", "skills", "project-setup", "templates");
}

/**
 * Returns the path to the installed templates directory.
 */
export function getInstalledTemplatesDir() {
  return join(homedir(), ".claude", "skills", "project-setup", "templates");
}

/**
 * List available templates by reading _index.md from the templates directory.
 * Returns [{id, name, description, file}]
 */
export async function listTemplates(templatesDir) {
  const dir = templatesDir || getTemplatesDir();
  const indexPath = join(dir, "_index.md");
  let content;
  try {
    content = await readFile(indexPath, "utf8");
  } catch {
    return [];
  }
  return parseIndex(content);
}

/**
 * Parse _index.md content into a list of template entries.
 * Format: markdown table with columns: ID | Name | Description | File
 */
function parseIndex(content) {
  const lines = content.split("\n");
  const templates = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("|")) continue;

    const cells = trimmed
      .split("|")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    if (cells.length < 4) continue;

    // Skip header row
    if (cells[0].toLowerCase() === "id") {
      inTable = true;
      continue;
    }

    // Skip separator row
    if (cells[0].startsWith("-")) {
      continue;
    }

    if (inTable) {
      templates.push({
        id: cells[0],
        name: cells[1],
        description: cells[2],
        file: cells[3],
      });
    }
  }

  return templates;
}

/**
 * Parse a template .md file into structured data.
 * Returns:
 * {
 *   meta: { id, name, description, version, detection },
 *   claude_md: "string",
 *   hooks: { PreToolUse: [...], PostToolUse: [...] },
 *   skills: { "name": "content", ... },
 *   agents: { "name": "content", ... },
 *   mcp_servers: { "name": {...}, ... }
 * }
 */
export async function parseTemplate(filePath) {
  const content = await readFile(filePath, "utf8");
  return parseTemplateContent(content);
}

/**
 * Parse template content string (exported for testing).
 */
export function parseTemplateContent(content) {
  const { frontmatter, body } = extractFrontmatter(content);
  const meta = parseFrontmatter(frontmatter);
  const sections = extractSections(body);

  return {
    meta,
    claude_md: sections.claude_md || "",
    hooks: sections.hooks || {},
    skills: sections.skills || {},
    agents: sections.agents || {},
    mcp_servers: sections.mcp_servers || {},
  };
}

/**
 * Split content into YAML frontmatter and body.
 */
function extractFrontmatter(content) {
  const lines = content.split("\n");

  if (lines[0].trim() !== "---") {
    return { frontmatter: "", body: content };
  }

  let endIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontmatter: "", body: content };
  }

  return {
    frontmatter: lines.slice(1, endIndex).join("\n"),
    body: lines.slice(endIndex + 1).join("\n"),
  };
}

/**
 * Hand-rolled shallow YAML parser for frontmatter.
 * Supports: scalars, simple lists (- item), and nested keys one level deep.
 */
function parseFrontmatter(yaml) {
  if (!yaml.trim()) return {};

  const result = {};
  const lines = yaml.split("\n");
  let currentKey = null;
  let currentIndent = 0;

  for (const line of lines) {
    // Skip empty lines and comments
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const indent = line.length - line.trimStart().length;
    const trimmed = line.trim();

    // Top-level key: value
    if (indent === 0 && trimmed.includes(":")) {
      const colonIdx = trimmed.indexOf(":");
      const key = trimmed.slice(0, colonIdx).trim();
      const value = trimmed.slice(colonIdx + 1).trim();

      if (value) {
        // Scalar value — strip quotes
        result[key] = value.replace(/^["']|["']$/g, "");
        // Convert numeric strings
        if (/^\d+$/.test(result[key])) {
          result[key] = parseInt(result[key], 10);
        }
        currentKey = null;
      } else {
        // Start of nested object or list
        result[key] = {};
        currentKey = key;
        currentIndent = indent;
      }
      continue;
    }

    // Nested content under currentKey
    if (currentKey && indent > currentIndent) {
      // List item: "- value"
      if (trimmed.startsWith("- ")) {
        const item = trimmed.slice(2).trim().replace(/^["']|["']$/g, "");
        if (!Array.isArray(result[currentKey])) {
          result[currentKey] = [];
        }
        result[currentKey].push(item);
        continue;
      }

      // Nested key: value (one level)
      if (trimmed.includes(":")) {
        const colonIdx = trimmed.indexOf(":");
        const nestedKey = trimmed.slice(0, colonIdx).trim();
        const nestedValue = trimmed.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, "");

        if (typeof result[currentKey] !== "object" || Array.isArray(result[currentKey])) {
          result[currentKey] = {};
        }

        // Check if nestedValue starts a list on next lines
        if (nestedValue) {
          result[currentKey][nestedKey] = nestedValue;
          if (/^\d+$/.test(nestedValue)) {
            result[currentKey][nestedKey] = parseInt(nestedValue, 10);
          }
        } else {
          result[currentKey][nestedKey] = [];
          // The list items will be picked up on subsequent iterations
          // We need a sub-key tracker
          currentKey = currentKey + "." + nestedKey;
          // Store reference for nested list population
          const parts = currentKey.split(".");
          if (parts.length === 2) {
            if (typeof result[parts[0]] !== "object" || Array.isArray(result[parts[0]])) {
              result[parts[0]] = {};
            }
            result[parts[0]][parts[1]] = [];
          }
        }
        continue;
      }
    }

    // Handle deeply nested list items (e.g., detection.files_any items)
    if (currentKey && currentKey.includes(".") && trimmed.startsWith("- ")) {
      const parts = currentKey.split(".");
      const item = trimmed.slice(2).trim().replace(/^["']|["']$/g, "");
      if (parts.length === 2 && result[parts[0]] && Array.isArray(result[parts[0]][parts[1]])) {
        result[parts[0]][parts[1]].push(item);
        continue;
      }
    }

    // If we hit a non-indented line that isn't handled, reset
    if (indent <= currentIndent && currentKey) {
      // Reset to check if this is a new top-level key
      if (trimmed.includes(":")) {
        const colonIdx = trimmed.indexOf(":");
        const key = trimmed.slice(0, colonIdx).trim();
        const value = trimmed.slice(colonIdx + 1).trim();
        if (value) {
          result[key] = value.replace(/^["']|["']$/g, "");
          if (/^\d+$/.test(result[key])) {
            result[key] = parseInt(result[key], 10);
          }
          currentKey = null;
        } else {
          result[key] = {};
          currentKey = key;
          currentIndent = indent;
        }
      }
    }
  }

  return result;
}

/**
 * Find top-level ## headings, ignoring any inside fenced code blocks.
 * Returns [{name, index, fullMatch}] with positions relative to body.
 */
function findTopLevelSections(body) {
  const lines = body.split("\n");
  const sections = [];
  let inFence = false;
  let pos = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track fenced code block boundaries
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
    }

    // Only match ## headings outside of code blocks
    if (!inFence && /^## .+/.test(trimmed) && !trimmed.startsWith("### ")) {
      sections.push({
        name: trimmed.slice(3).trim().toLowerCase(),
        index: pos,
        fullMatch: line,
      });
    }

    pos += line.length + 1; // +1 for the \n
  }

  return sections;
}

/**
 * Extract sections from the body (after frontmatter).
 * Sections are delimited by ## headings (outside code blocks).
 * Subsections (### headings) are used for named entries within skills/agents.
 */
function extractSections(body) {
  const result = {
    claude_md: "",
    hooks: {},
    skills: {},
    agents: {},
    mcp_servers: {},
  };

  const sectionStarts = findTopLevelSections(body);

  if (sectionStarts.length === 0) {
    return result;
  }

  for (let i = 0; i < sectionStarts.length; i++) {
    const section = sectionStarts[i];
    const contentStart = section.index + section.fullMatch.length;
    const contentEnd =
      i + 1 < sectionStarts.length ? sectionStarts[i + 1].index : body.length;
    const content = body.slice(contentStart, contentEnd).trim();

    switch (section.name) {
      case "claude_md":
        result.claude_md = content;
        break;

      case "hooks":
        result.hooks = extractJsonBlock(content) || {};
        break;

      case "skills":
        result.skills = extractNamedSubsections(content);
        break;

      case "agents":
        result.agents = extractNamedSubsections(content);
        break;

      case "mcp_servers":
        result.mcp_servers = extractJsonBlock(content) || {};
        break;
    }
  }

  return result;
}

/**
 * Extract the first JSON code block from content.
 */
function extractJsonBlock(content) {
  const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Find top-level ### headings in content, ignoring any inside fenced code blocks.
 */
function findTopLevelSubsections(content) {
  const lines = content.split("\n");
  const subs = [];
  let inFence = false;
  let pos = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inFence = !inFence;
    }

    if (!inFence && /^### .+/.test(trimmed)) {
      subs.push({
        name: trimmed.slice(4).trim(),
        index: pos,
        fullMatch: line,
      });
    }

    pos += line.length + 1;
  }

  return subs;
}

/**
 * Extract ### subsections as named entries.
 * Returns { "name": "content", ... }
 * Content is extracted from markdown code blocks within each subsection.
 */
function extractNamedSubsections(content) {
  const result = {};
  const subStarts = findTopLevelSubsections(content);

  for (let i = 0; i < subStarts.length; i++) {
    const sub = subStarts[i];
    const subContentStart = sub.index + sub.fullMatch.length;
    const subContentEnd =
      i + 1 < subStarts.length ? subStarts[i + 1].index : content.length;
    const subContent = content.slice(subContentStart, subContentEnd).trim();

    // Extract content from markdown code block
    const mdBlock = subContent.match(/```markdown\s*\n([\s\S]*?)\n```/);
    if (mdBlock) {
      result[sub.name] = mdBlock[1].trim();
    } else {
      // Use the raw content if no code block
      result[sub.name] = subContent;
    }
  }

  return result;
}

/**
 * Find a template by ID from available templates.
 * Searches the given directory (or bundled templates).
 */
export async function findTemplate(templateId, templatesDir) {
  const dir = templatesDir || getTemplatesDir();
  const templates = await listTemplates(dir);
  const entry = templates.find((t) => t.id === templateId);
  if (!entry) return null;
  return parseTemplate(join(dir, entry.file));
}
