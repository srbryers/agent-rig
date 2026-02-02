# Windows Considerations Reference

Platform-specific adjustments for generating Claude Code configuration on Windows.

---

## Platform Detection

Check the platform before generating any hook commands or scripts:
- Use `process.platform` equivalent by checking the OS context provided by Claude Code
- On Windows, the platform value is `win32`
- If the platform is `win32`, apply all adjustments in this document

---

## Path Handling

### Path Separators
- Windows uses backslashes (`\`) in paths, but most Node.js tools and npx accept forward slashes (`/`)
- `$CLAUDE_FILE_PATHS` may contain either separator depending on the tool
- When writing hook commands, prefer tools that handle both (most modern tools do)

### Absolute vs Relative Paths
- Hook commands receive `$CLAUDE_FILE_PATHS` as an environment variable
- The paths may be absolute (e.g., `C:\Users\dev\project\src\file.ts`)
- Most formatters handle absolute paths correctly on Windows

### Space in Paths
- Windows paths frequently contain spaces (e.g., `C:\Users\John Doe\...`)
- Always quote `$CLAUDE_FILE_PATHS` in hook commands: `"$CLAUDE_FILE_PATHS"`
- For PowerShell commands, use proper quoting: `"$env:CLAUDE_FILE_PATHS"`

---

## Shell Compatibility

### Hook Commands
Claude Code on Windows executes hook commands via the system shell. Consider:

- **npx commands** work the same: `npx prettier --write $CLAUDE_FILE_PATHS`
- **Shell builtins** differ between cmd, PowerShell, and bash
- **`case` statements** (bash) don't work on Windows — use PowerShell equivalents

### PreToolUse Guard Scripts

**Bash (Unix):**
```bash
case "$CLAUDE_FILE_PATHS" in *.env*) echo 'BLOCKED' && exit 2;; esac
```

**PowerShell (Windows):**
```powershell
powershell -Command "if ($env:CLAUDE_FILE_PATHS -match '\.env') { Write-Output 'BLOCKED: Do not edit .env files directly.'; exit 2 }"
```

### Chaining Commands
- Unix: `command1 && command2`
- Windows (cmd): `command1 && command2` (same syntax, works)
- Windows (PowerShell): `command1; if ($LASTEXITCODE -eq 0) { command2 }`

For hook commands, `&&` chaining generally works on Windows since hooks execute in a compatible shell context. Prefer simple `&&` chaining when possible.

---

## Tool-Specific Notes

### npx on Windows
- `npx` works on Windows when Node.js is installed
- Some packages may have Windows-specific issues; `npx -y` ensures auto-install
- If a tool fails on Windows, note it in the post-generation summary

### Go Tools
- `gofmt` and `goimports` work the same on Windows
- Path separators are handled by the Go toolchain

### Rust Tools
- `rustfmt` and `cargo clippy` work the same on Windows
- `cargo` commands are cross-platform

### Python Tools
- `ruff`, `black`, `pylint` all work on Windows
- Use `python` instead of `python3` on Windows (typically)
- Virtual environment activation: `.venv\Scripts\activate` vs `source .venv/bin/activate`

---

## MCP Server Considerations

### stdio Servers via npx
- MCP servers launched via `npx` work the same on Windows
- The `command` field in `.mcp.json` should be `npx` (not `npx.cmd`)
- Claude Code handles the npx resolution internally

### Environment Variables
- Environment variables in `.mcp.json` `env` field work cross-platform
- The JSON structure is identical on all platforms

---

## Generated File Line Endings

- Write all generated files with the line endings appropriate for the platform
- Claude Code's Write tool handles this automatically
- JSON files are line-ending agnostic
- Markdown files should use the platform default

---

## Summary of Windows Adjustments

| Component | Unix | Windows Equivalent |
|-----------|------|--------------------|
| PreToolUse guard (bash case) | `case ... esac` | `powershell -Command "if (...) { ...; exit 2 }"` |
| File path quoting | `"$CLAUDE_FILE_PATHS"` | `"$CLAUDE_FILE_PATHS"` (same) |
| Command chaining | `&&` | `&&` (works in hook context) |
| npx | `npx` | `npx` (same) |
| Python binary | `python3` | `python` |
| Venv activation | `source .venv/bin/activate` | `.venv\Scripts\activate` |
