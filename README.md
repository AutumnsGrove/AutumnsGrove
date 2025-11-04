# AutumnsGrove

A personal website for blogging, demonstrating projects, and sharing articles. Built with Python, JavaScript, and HTML/CSS.

**Features:** Blog posts • Project showcases • Article sharing • Clean, modern design

## 🚀 Quick Start

### Development Setup

```bash
# Install Python dependencies
uv init
uv sync

# Install JavaScript dependencies
npm install

# Run development server
# (TBD - coming soon)
```

---

## 📁 Project Structure

```
AutumnsGrove/
├── src/                        # Source code
│   ├── __init__.py
│   └── (coming soon)
├── tests/                      # Test files
│   └── __init__.py
├── static/                     # Static assets (CSS, JS, images)
├── templates/                  # HTML templates
├── CLAUDE.md                   # Claude Code instructions
├── ClaudeUsage/                # Development guides
└── .gitignore
```

---

## 🏠 House Agents Integration

This template works seamlessly with [house-agents](https://github.com/houseworthe/house-agents) - specialized Claude Code sub-agents that keep your context clean.

### What Are House Agents?

Specialized sub-agents that run heavy operations in separate context windows:
- **house-research** - Search 70k+ tokens across files, return 3k summary (95% savings)
- **house-git** - Analyze 43k token diffs, return 500 token summary (98% savings)
- **house-bash** - Process 21k+ command output, return 700 token summary (97% savings)

### Quick Install

**Project-Level (this project only):**
```bash
git clone https://github.com/houseworthe/house-agents.git /tmp/house-agents
cp -r /tmp/house-agents/.claude .
```

**User-Wide (all projects):**
```bash
git clone https://github.com/houseworthe/house-agents.git /tmp/house-agents
mkdir -p ~/.claude/agents
cp /tmp/house-agents/.claude/agents/*.md ~/.claude/agents/
```

**Test Installation:**
```
Use house-research to find all TODO comments in the codebase
```

See [ClaudeUsage/house_agents.md](ClaudeUsage/house_agents.md) for usage patterns and examples.

**Credit:** House Agents by [@houseworthe](https://github.com/houseworthe/house-agents) (v0.2.0-beta)

---

## 🎯 What You Get

### Instant Best Practices
- **Git workflow patterns** - Conventional commits, unified git guide
- **Database architecture** - SQLite with isolated database.py interface
- **Security by default** - API key management, secrets scanning hooks
- **Code quality hooks** - 8 production-ready git hooks for Python, JS, Go, multi-language
  - `pre-commit-secrets-scanner` - Prevents committing API keys (15+ patterns)
  - Language-specific formatters (Black, Prettier, gofmt) and linters
  - Auto-run tests before push, auto-update deps on branch switch
  - Interactive installer with auto-detection
- **Testing strategies** - Unit, integration, and E2E test patterns
- **CI/CD templates** - GitHub Actions workflows
- **Documentation standards** - Consistent, scannable docs

### Claude-Optimized Workflows
- **House agents** - Specialized agents for research, coding, git analysis
- **Context7 integration** - Automatic library documentation fetching
- **TODO management** - Task tracking integrated into workflow
- **Subagent patterns** - Breaking down complex tasks

### Multi-Language Support
Guides and patterns for:
- Python (with UV package manager)
- JavaScript/TypeScript
- Go
- Rust
- Docker containerization

---

## 📚 Documentation Structure

All guides follow a consistent, scannable format:

1. **Overview** - What the guide covers
2. **When to Use** - Specific triggers and scenarios
3. **Core Concepts** - Key principles
4. **Practical Examples** - Real-world code
5. **Common Pitfalls** - What to avoid
6. **Related Guides** - Cross-references

See [ClaudeUsage/README.md](ClaudeUsage/README.md) for the complete index.

---

## 🎯 Roadmap

See [TODOS.md](TODOS.md) for current tasks and planned features.

---

## 💡 Key Workflows

### Starting a New Feature
1. Check `TODOS.md` for pending tasks
2. Use Context7 to fetch relevant library docs
3. Follow git workflow for commits
4. Update TODOS.md as you progress

### Managing Secrets
1. Read `ClaudeUsage/secrets_management.md`
2. Create `secrets.json` (gitignored)
3. Provide `secrets_template.json` for team
4. Use environment variable fallbacks

### Large Codebase Search
1. Use house-research agent for 20+ file searches
2. Check `ClaudeUsage/house_agents.md` for patterns
3. Use subagents for complex multi-step tasks

### Writing Tests
1. Review `ClaudeUsage/testing_strategies.md`
2. Follow framework-specific patterns
3. Use test-strategist agent for planning

---

## 🔐 Security Defaults

This template includes security best practices by default:

- ✅ `secrets.json` in `.gitignore`
- ✅ **Pre-commit secrets scanner** - Detects 15+ secret patterns before commit
  - Anthropic, OpenAI, AWS, GitHub, Google API keys
  - JWT tokens, bearer tokens, private keys
  - Hardcoded passwords and database credentials
  - Actionable fix instructions when secrets detected
- ✅ Environment variable fallback patterns
- ✅ Security audit guides in `secrets_advanced.md`

---

## 🤝 Working with Claude Code

This template is optimized for Claude Code CLI. Key features:

- **CLAUDE.md** triggers automatic context loading
- **Structured guides** for quick reference without token bloat
- **Subagent workflows** for complex tasks
- **Git commit standards** with auto-formatting

### Example Session
```bash
cd ~/Projects/MyNewProject/

# Claude automatically reads CLAUDE.md and knows your project context
claude "Add user authentication with JWT tokens"

# Claude will:
# 1. Check TODOS.md
# 2. Use Context7 to fetch JWT library docs
# 3. Implement following your git commit standards
# 4. Update TODOS.md
# 5. Commit with proper message format
```

---

## 📖 Learning Path

Recommended reading order for new projects:

1. [project_structure.md](ClaudeUsage/project_structure.md) - Directory layouts
2. [git_guide.md](ClaudeUsage/git_guide.md) - Version control and conventional commits
3. [db_usage.md](ClaudeUsage/db_usage.md) - Database setup (if using databases)
4. [secrets_management.md](ClaudeUsage/secrets_management.md) - API keys
5. [uv_usage.md](ClaudeUsage/uv_usage.md) - Python dependencies (if applicable)
6. [testing_strategies.md](ClaudeUsage/testing_strategies.md) - Test setup
7. [house_agents.md](ClaudeUsage/house_agents.md) - Advanced workflows

---

## 🆘 Troubleshooting

<!-- TEMPLATE: START -->

### "Git not initialized"
```bash
git init
git add .
git commit -m "Initial commit"
```

### "CLAUDE.md not found"
If you see this error, the setup script may not have run properly. Make sure you've run `bash setup.sh` in your project directory.

<!-- TEMPLATE: END -->

### "Pre-commit hooks not working"
```bash
chmod +x ClaudeUsage/pre_commit_hooks/*
./ClaudeUsage/pre_commit_hooks/install_hooks.sh
```

See [ClaudeUsage/pre_commit_hooks/TROUBLESHOOTING.md](ClaudeUsage/pre_commit_hooks/TROUBLESHOOTING.md) for comprehensive hook troubleshooting.

---


---

## 📝 Development

This project is built with Claude Code and follows best practices from the BaseProject template.

See `ClaudeUsage/` directory for comprehensive development guides.

---

## 📄 License

TBD

---

**Last updated:** 2025-11-04
**Built with:** Claude Code CLI
**Template:** BaseProject by AutumnsGrove
