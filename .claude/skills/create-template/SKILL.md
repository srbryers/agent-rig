---
name: create-template
description: Scaffold a new project-type template with correct frontmatter, sections, and registry entry
invocation: user
user_invocation: /create-template
---

# Create Template

Scaffold a new project-type template `.md` file for agent-rig. Templates define the complete Claude Code configuration for a project type (CLAUDE.md content, hooks, skills, agents, MCP servers, and external skills).

## Context

- Templates live in `skills/project-setup/templates/`
- The template registry is `skills/project-setup/templates/_index.md`
- Parsing logic is in `src/templates.mjs` — templates must parse cleanly through `parseTemplateContent()`
- See existing templates (e.g., `nextjs-sanity.md`, `python-fastapi.md`) for reference

## Steps

1. **Gather information** — Ask the user for:
   - **Template ID** (kebab-case, e.g., `rails-api`, `sveltekit-app`)
   - **Display name** (e.g., "Rails API", "SvelteKit App")
   - **Description** (one sentence describing the project type)
   - **Detection criteria** — which files, config files, or dependencies identify this project type (need at least 2 detection groups for auto-matching)

2. **Create the template file** — Write `skills/project-setup/templates/{id}.md` with this structure:

   ```
   ---
   id: {id}
   name: {name}
   description: {description}
   version: 1
   detection:
     files_any:
       - "file-pattern"
     config_files_any:
       - "config-file"
     package_json_deps_any:
       - "dependency"
   ---

   # {name}

   ## claude_md

   ### Project Overview
   (Project type description and key technologies)

   ### Build & Run Commands
   ```bash
   # Common commands for this project type
   ```

   ### Code Style
   (Conventions, naming, patterns)

   ### Project Structure
   ```
   (Directory tree)
   ```

   ## hooks

   ```json
   {
     "PreToolUse": [],
     "PostToolUse": []
   }
   ```

   ## skills

   (Add ### subsections with ```markdown code blocks for each skill)

   ## agents

   (Add ### subsections with ```markdown code blocks for each agent)

   ## mcp_servers

   ```json
   {
     "context7": {
       "command": "npx",
       "args": ["-y", "@upstash/context7-mcp@latest"],
       "type": "stdio"
     }
   }
   ```

   ## external_skills

   | Name | Repository | Skill | Description |
   |------|-----------|-------|-------------|
   ```

3. **Populate sections** — Work with the user to fill in project-specific content for each section. Use the analysis heuristics in `skills/project-setup/references/analysis-heuristics.md` to determine appropriate hooks, skills, agents, and MCP servers.

4. **Register the template** — Add a row to `skills/project-setup/templates/_index.md`:
   ```
   | {id} | {name} | {description} | {id}.md |
   ```

5. **Validate** — Read the generated template file and verify:
   - YAML frontmatter has all required fields: `id`, `name`, `description`, `version`, `detection`
   - Detection has at least 2 field groups (e.g., `files_any` + `package_json_deps_any`)
   - All `## sections` are present: `claude_md`, `hooks`, `skills`, `agents`, `mcp_servers`, `external_skills`
   - JSON code blocks in `hooks` and `mcp_servers` are valid JSON
   - `external_skills` table has the correct column headers
   - No `## headings` appear inside code fences (they would be mis-parsed as section delimiters)

## Output Format

Report the created file path and a summary:
- Template ID and name
- Detection criteria configured
- Number of hooks, skills, agents, MCP servers, and external skills defined
- Any validation warnings
