# Agent Handoff: Grove Writing Assistant Implementation

> **Copy everything below the line to hand off to an agent**

---

## Your Mission

Implement the Grove Writing Assistant - an ethical AI writing tool that helps users polish their voice without replacing it. This feature will be integrated into GroveEngine for all Grove-powered sites.

**Key principle:** "A helper, not a writer"

## Project Context

You have access to two repositories:
- **AutumnsGrove** (current directory) - Reference implementation with existing (broken) AI Writing Assistant
- **GroveEngine** - The engine package where this feature will live

The unified spec is at: `docs/plans/writing-assistant-unified-spec.md`

## Phase 1: Vibe Check Validation

Before writing any code, you must understand the Grove ecosystem's patterns and ensure the spec fits perfectly.

### Step 1.1: Explore the Specs

Read and analyze these documents:

**In GroveEngine repo:**
```
https://github.com/AutumnsGrove/GroveEngine/blob/main/docs/specs/CONTENT-MODERATION.md
https://github.com/AutumnsGrove/GroveEngine/blob/main/docs/grove-naming.md
https://github.com/AutumnsGrove/GroveEngine/blob/main/docs/specs/  (explore all specs)
```

**In AutumnsGrove (local):**
```
docs/plans/writing-assistant-unified-spec.md  (the new unified spec)
docs/plans/ai-writing-assistant-spec.md       (original spec for reference)
src/routes/api/ai/writing-assist/+server.js   (existing implementation)
src/lib/components/custom/AIWritingPanel.svelte (existing UI)
src/lib/config/ai-models.js                   (existing config)
```

### Step 1.2: Analyze Patterns

After reading, answer these questions (share your findings with me):

1. **Infrastructure patterns:** How does Content Moderation handle provider fallbacks? Can we share code?
2. **API patterns:** What's the standard endpoint structure in GroveEngine?
3. **Component patterns:** How are other engine components structured?
4. **Config patterns:** Where do model configs typically live?
5. **Database patterns:** How are tables named? What's the migration strategy?

### Step 1.3: Identify Refinements

Based on your analysis, suggest any changes to the unified spec:

- Does anything conflict with existing patterns?
- Are there opportunities to reuse existing code?
- Should any sections be restructured?
- Are there missing considerations?

**Present your findings and wait for my approval before proceeding.**

## Phase 2: Naming Session

This feature needs a name that fits the Grove ecosystem.

### Step 2.1: Study the Naming Guide

Read `grove-naming.md` carefully. Note:
- Names reference forest elements (not trees directly)
- Each name connects conceptually to its function
- Warm, literary quality
- Works as part of the interconnected ecosystem

Existing names for reference:
| Name | Function |
|------|----------|
| Meadow | Social layer |
| Heartwood | Authentication |
| Shade | AI content protection |
| Foliage | Visual theming |
| Rings | Private analytics |
| Amber | Storage management |
| Ivy | Email |

### Step 2.2: Brainstorm Names

Generate 5-8 name candidates for the Writing Assistant. For each name:
- Explain the natural element reference
- Connect it to the feature's function (polishing writing, gentle feedback)
- Consider how it sounds alongside existing names

**Think about:**
- What natural process involves refinement or polishing?
- What forest element is supportive but non-intrusive?
- What conveys "helper" energy?

### Step 2.3: Interactive Discussion

Present your candidates to me. We'll discuss:
- Which names resonate
- Any I want to explore further
- Potential concerns
- Final selection

**Do not proceed until we've agreed on a name together.**

## Phase 3: Spec Finalization

After naming and vibe check:

1. Update the unified spec with:
   - The chosen name throughout
   - Any refinements from Phase 1
   - Finalized API endpoint path
   - Component naming (e.g., `[Name]Panel.svelte`)

2. Decide on placement:
   - Should this be `packages/engine/src/lib/components/[Name]/`?
   - Or follow another pattern you observed?

3. **Get my approval on the final spec before implementing.**

## Phase 4: Implementation

Follow the Implementation Guide in the unified spec. Work in phases:

### 4.1: Infrastructure
- Config file with model/provider settings
- Inference client (check if Content Moderation has reusable code)
- Readability utilities (port from existing)

### 4.2: API Endpoint
- Request validation
- Rate limiting
- Prompt construction with security protections
- Provider fallback logic
- Response handling

### 4.3: UI Component
- Panel with ASCII vibes
- Mode selector (Quick/Thorough)
- Results display
- Fix application

### 4.4: Integration
- Settings toggle
- Export from engine
- Documentation

## Implementation Notes

### Existing Code to Reference

The current (broken) implementation in AutumnsGrove has:
- Working UI component with ASCII art vibes
- Readability calculation algorithm
- Rate limiting logic
- Database schema

You can port/adapt this code rather than starting from scratch.

### What's Broken Currently

The existing implementation calls Anthropic's API directly but doesn't work. We're:
1. Switching to DeepSeek V3.2 via Fireworks AI
2. Aligning with Content Moderation's provider patterns
3. Moving to GroveEngine for all consumers

### Key Files to Create (tentative, confirm after Phase 1)

```
packages/engine/
├── src/lib/config/
│   └── [name]-assist.js           # Model config, pricing
├── src/lib/utils/
│   └── readability.js             # Local calculations
├── src/lib/components/
│   └── [Name]Panel.svelte         # Main UI component
├── src/routes/api/grove/
│   └── [name]-assist/
│       └── +server.js             # API endpoint
└── docs/specs/
    └── [NAME].md                  # Final spec
```

## Communication Style

- Ask me questions when you're uncertain
- Share your thinking, especially during naming
- Present options rather than making unilateral decisions
- Keep me updated on progress between phases

## Success Criteria

- [ ] Vibe check completed, patterns understood
- [ ] Name chosen collaboratively
- [ ] Spec finalized and approved
- [ ] Implementation follows Grove patterns
- [ ] Feature works end-to-end
- [ ] Existing AutumnsGrove code migrated or removed
- [ ] Documentation complete

---

**Ready to begin? Start with Phase 1: Vibe Check Validation.**
