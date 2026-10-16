# Project Instructions - Agent Workflows

> **Note**: This is the main orchestrator file. For detailed guides, see `archives/AgentUsage/README.md`

---

## Project Purpose
AutumnsGrove is a personal website for blogging, demonstrating projects, and sharing articles. It serves as a digital portfolio and content hub.

## Tech Stack
- Language: Python, JavaScript, HTML/CSS
- Framework: SvelteKit (frontend), Cloudflare Workers (backend)
- Key Libraries: D3.js for visualizations
- Package Manager: UV (Python), pnpm (JavaScript)

## Architecture Notes
Static website with dynamic content via Cloudflare Workers. Organized around blog posts, project showcases, and article sharing. Uses R2 for image/CDN hosting and D1 for data storage.

---

## Essential Instructions (Always Follow)

### Core Behavior
- Do what has been asked; nothing more, nothing less
- NEVER create files unless absolutely necessary for achieving your goal
- ALWAYS prefer editing existing files to creating new ones
- NEVER proactively create documentation files (*.md) or README files unless explicitly requested

### Naming Conventions
- **Directories**: Use CamelCase (e.g., `VideoProcessor`, `AudioTools`, `DataAnalysis`)
- **Date-based paths**: Use skewer-case with YYYY-MM-DD (e.g., `logs-2025-01-15`, `backup-2025-12-31`)
- **No spaces or underscores** in directory names (except date-based paths)

### TODO Management
- **Always check `archives/development/TODOS.md` first** when starting a task or session
- **Update immediately** when tasks are completed, added, or changed
- Keep the list current and manageable

### Git Workflow Essentials

**After completing major changes, you MUST commit your work.**

**Conventional Commits Format:**
```bash
<type>: <brief description>

<optional body>

🤖 Generated with <the agent you are running> (<link to it>)

Co-Authored-By: <that agent's model> <agent@localhost>
```

**Attribution:** sign the commit as the agent *actually* running the session — e.g. pi with `deepseek-v4.1-flash`, Nova, crush, or Claude Code with `claude-opus`. Fill in your real tool and model; never copy another agent's name or leave a stale default behind.

**Common Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`

**Examples:**
```bash
feat: Add user authentication
fix: Correct timezone bug
docs: Update README
```

**For complete details:** See `archives/AgentUsage/git_guide.md`

---

## When to Read Specific Guides

**Read the full guide in `archives/AgentUsage/` when you encounter these situations:**

### Secrets & API Keys
- **When managing API keys or secrets** → Read `archives/AgentUsage/secrets_management.md`
- **Before implementing secrets loading** → Read `archives/AgentUsage/secrets_management.md`

### Package Management
- **When using UV package manager** → Read `archives/AgentUsage/uv_usage.md`
- **Before creating pyproject.toml** → Read `archives/AgentUsage/uv_usage.md`
- **When managing Python dependencies** → Read `archives/AgentUsage/uv_usage.md`

### Version Control
- **Before making a git commit** → Read `archives/AgentUsage/git_guide.md`
- **When initializing a new repo** → Read `archives/AgentUsage/git_guide.md`
- **For git workflow and branching** → Read `archives/AgentUsage/git_guide.md`
- **For conventional commits reference** → Read `archives/AgentUsage/git_guide.md`

### Database Management
- **When working with databases** → Read `archives/AgentUsage/db_usage.md`
- **Before implementing data persistence** → Read `archives/AgentUsage/db_usage.md`
- **For database.py template** → Read `archives/AgentUsage/db_usage.md`

### Search & Research
- **When searching across 20+ files** → Read `archives/AgentUsage/house_agents.md`
- **When finding patterns in codebase** → Read `archives/AgentUsage/house_agents.md`
- **When locating TODOs/FIXMEs** → Read `archives/AgentUsage/house_agents.md`

### Testing
- **Before writing tests** → Read `archives/AgentUsage/testing_strategies.md`
- **When implementing test coverage** → Read `archives/AgentUsage/testing_strategies.md`
- **For test organization** → Read `archives/AgentUsage/testing_strategies.md`

### Code Quality
- **When refactoring code** → Read `archives/AgentUsage/code_style_guide.md`
- **Before major code changes** → Read `archives/AgentUsage/code_style_guide.md`
- **For style guidelines** → Read `archives/AgentUsage/code_style_guide.md`

### Project Setup
- **When starting a new project** → Read `archives/AgentUsage/project_setup.md`
- **For directory structure** → Read `archives/AgentUsage/project_setup.md`
- **Setting up CI/CD** → Read `archives/AgentUsage/project_setup.md`

### Svelte Development
- **When working with Svelte 5 components** → Read `archives/AgentUsage/svelte5_guide.md`
- **Before using runes** → Read `archives/AgentUsage/svelte5_guide.md`
- **For SvelteKit routing and data loading** → Read `archives/AgentUsage/svelte5_guide.md`

---

## Quick Reference

### Security Basics
- Store API keys in `secrets.json` (NEVER commit)
- Add `secrets.json` to `.gitignore` immediately
- Provide `secrets_template.json` for setup
- Use environment variables as fallbacks

### House Agents Quick Trigger
**When searching 20+ files**, use house-research for:
- Finding patterns across codebase
- Searching TODO/FIXME comments
- Locating API endpoints or functions
- Documentation searches

---

## Code Style Guidelines

### Function & Variable Naming
- Use meaningful, descriptive names
- Keep functions small and focused on single responsibilities
- Add docstrings to functions and classes

### Error Handling
- Use try/except blocks gracefully
- Provide helpful error messages
- Never let errors fail silently

### File Organization
- Group related functionality into modules
- Use consistent import ordering:
  1. Standard library
  2. Third-party packages
  3. Local imports
- Keep configuration separate from logic

---

## Communication Style
- Be concise but thorough
- Explain reasoning for significant decisions
- Ask for clarification when requirements are ambiguous
- Proactively suggest improvements when appropriate

---

## Complete Guide Index
For all detailed guides, workflows, and examples, see:
**`archives/AgentUsage/README.md`** - Master index of all documentation

---

*Last updated: 2025-11-20*
