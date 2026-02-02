# agentrig

Rig up your project for agentic coding. Analyzes any codebase and generates a complete Claude Code configuration (CLAUDE.md, hooks, skills, subagents, MCP servers).

## Install

```bash
npm i -g agentrig
```

Or use without installing:

```bash
npx agentrig install
```

## Usage

```
agentrig install          # Copy skill files to ~/.claude/skills/project-setup/
agentrig uninstall        # Remove installed skill files
agentrig status           # Show installation status
agentrig --version        # Print version
agentrig --help           # Print usage
```

### Install options

```
agentrig install --force  # Overwrite existing installation without prompting
```

## What it does

`agentrig install` copies the bundled `project-setup` skill into `~/.claude/skills/project-setup/`. Once installed, use `/project-setup` inside Claude Code to analyze your codebase and generate tailored configuration.

The skill analyzes your project in three phases:

1. **Analyze** -- detects languages, frameworks, formatters, test tools, and more
2. **Present plan** -- shows a structured recommendation report for your approval
3. **Generate** -- writes CLAUDE.md, hooks, skills, agents, and MCP server configs

## Requirements

- Node.js >= 18
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)

## License

MIT
