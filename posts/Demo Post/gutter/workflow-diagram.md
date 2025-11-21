# Building with Claude Code

```mermaid
flowchart TD
    A["Describe"]
    B["Screenshot"]
    C["Claude Builds"]
    D["Review"]
    E{"Done?"}
    F["Ship It!"]

    A --> B
    B --> C
    C --> D
    D --> E
    E -->|No| A
    E -->|Yes| F

    style A fill:#e8f5e9,stroke:#2c5f2d,color:#1a1a1a
    style B fill:#e8f5e9,stroke:#2c5f2d,color:#1a1a1a
    style C fill:#fff3e0,stroke:#f57c00,color:#1a1a1a
    style D fill:#e3f2fd,stroke:#1976d2,color:#1a1a1a
    style E fill:#fce4ec,stroke:#c2185b,color:#1a1a1a
    style F fill:#c8e6c9,stroke:#388e3c,color:#1a1a1a
```

## How We Built the Gutter Feature

**Total Time:** ~1 hour
**Lines of Code Written by Human:** 0
**Screenshots Shared:** 4

### The Conversation Flow:

1. **"Add gutters to blog posts"** + rough sketch
2. Claude asks clarifying questions
3. Claude builds & pushes
4. **"Images too big, widen the gutter"** + screenshot
5. Claude adjusts & pushes
6. **"Items aren't anchored"** + screenshot
7. Claude fixes positioning & pushes
8. **"They're overlapping"** + screenshot
9. Claude adds collision detection & pushes
10. **"Add click to expand"**
11. Claude builds lightbox & pushes
12. ✅ **Done!**

---

*No framework docs. No Stack Overflow. No debugging config files.*
*Just describe what you want and watch it happen.*
