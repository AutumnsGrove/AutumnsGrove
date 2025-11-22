# Git Hooks

This directory contains shared git hooks for the project.

## Setup

After cloning the repository, run this command to enable the hooks:

```bash
git config core.hooksPath .githooks
```

## Hooks Included

- **pre-commit** - Multi-language code quality checks (Python, JS/TS, Go, Rust, JSON, YAML)
- **pre-commit-secrets** - Scans for accidentally committed secrets
- **commit-msg** - Validates commit message format
- **post-checkout** - Post-checkout tasks
- **pre-push** - Runs tests before pushing
