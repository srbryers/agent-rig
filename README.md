# agent-rig

Rig up your project for agentic coding. Analyzes any codebase and generates a complete Claude Code configuration (CLAUDE.md, hooks, skills, subagents, MCP servers).

## Install

```bash
npm i -g @srbryers/agent-rig
```

Or use without installing:

```bash
npx @srbryers/agent-rig install
```

## Usage

```
agentrig install              # Copy skill files to ~/.claude/skills/project-setup/
agentrig uninstall            # Remove installed skill files
agentrig status               # Show installation status
agentrig init <template>      # Generate config from a project-type template
agentrig --version            # Print version
agentrig --help               # Print usage
```

### Install options

```
agentrig install --force      # Overwrite existing installation without prompting
```

### Init options

```
agentrig init --list          # List available templates
agentrig init shopify-theme   # Generate config from the shopify-theme template
agentrig init shopify-theme --dry-run   # Preview without writing files
agentrig init shopify-theme --force     # Overwrite existing files without prompting
agentrig init shopify-theme --dir ./my-project  # Target a specific directory
```

## What it does

### `/project-setup` skill

`agentrig install` copies the bundled `project-setup` skill into `~/.claude/skills/project-setup/`. Once installed, use `/project-setup` inside Claude Code to analyze your codebase and generate tailored configuration.

The skill analyzes your project in three phases:

1. **Analyze** -- detects languages, frameworks, formatters, test tools, and more
2. **Present plan** -- shows a structured recommendation report for your approval
3. **Generate** -- writes CLAUDE.md, hooks, skills, agents, and MCP server configs

When a project matches a known template (e.g., Shopify theme, FastAPI app), the skill automatically incorporates domain-specific recommendations marked with `[T]` prefixes in the report.

### `agentrig init`

For quick setup without full analysis, `agentrig init <template>` generates a complete Claude Code configuration from a curated project-type template. This writes CLAUDE.md, hooks, skills, agents, and MCP server configs in one step.

## Available Templates

| Template | Description |
|----------|-------------|
| `shopify-theme` | Shopify theme development with Liquid, Dawn, and Online Store 2.0 |
| `shopify-app` | Shopify app development with React Router, Polaris, Prisma, and extensions |
| `nextjs-sanity` | Next.js with Sanity CMS, App Router, GROQ, and Sanity Studio |
| `python-fastapi` | Python API development with FastAPI, Pydantic, and SQLAlchemy |

Run `agentrig init --list` to see all available templates.

## Requirements

- Node.js >= 18
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)

## License

MIT
