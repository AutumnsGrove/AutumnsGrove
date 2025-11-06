# Future Ideas & Enhancements

> **Note**: This is a parking lot for ideas to implement later. Not all ideas will necessarily be implemented.

---

## UI & Styling

### Component Libraries
- **[shadcn-svelte](https://github.com/huntabyte/shadcn-svelte)**: Pre-built accessible components
- **Tailwind CSS**: Utility-first CSS framework for custom styling

**Decision needed**: Choose between shadcn-svelte (pre-built) vs Tailwind (custom) or use both

---

## Images & Media

### Image Optimization
- **[@sveltejs/enhanced-img](https://svelte.dev/docs/kit/images#sveltejs-enhanced-img)**: Built-in SvelteKit image optimization
- **Hosting Strategy**: Images stored in GitHub repo, linked to website

---

## Icons

### Icon Library
- **[Lucide](https://lucide.dev/)**: Icon library with excellent Svelte integration
- Clean, consistent icon set for UI elements

---

## AI Integration (Research Needed)

### Considerations
- **[Vercel AI SDK](https://ai-sdk.dev/docs/introduction)**: Potential AI features
- **Concerns**:
  - May be too complex for a blog
  - Cloudflare compatibility unclear
  - Would need to use Cloudflare Workers AI platform
- **Status**: Research needed before committing to this

---

## User Authentication (Future - Far Down the Line)

### Potential Solutions
- **[Better Auth](https://www.better-auth.com/)**: Modern auth library
- **[Supabase SSR](https://github.com/supabase/ssr)**: Supabase auth with SSR support

### Features to Implement (Eventually)
- User login/registration
- Comment system on blog posts
- Like/upvote functionality on posts

---

## Inspiration & Research

### Websites to Study
> Add URLs and notes about what you liked about each website

**Template:**
```
- **URL**:
  - What I liked:
  - Design elements:
  - Features to potentially adopt:
```

**Examples:**

---

## Learning Resources

- [Svelte Packages](https://svelte.dev/packages) - Main source for Svelte ecosystem packages

---

## Suggestions & Feedback

### Recommendations for Getting Started

1. **Start with styling basics**: Get comfortable with Tailwind first before adding component libraries
2. **Images next**: Implement @sveltejs/enhanced-img early - easier to set up optimization from the start
3. **Add icons**: Lucide integration is straightforward and will make UI look more polished
4. **Study existing Svelte blogs**: Look for simple, clean blog implementations for inspiration
5. **Keep it simple**: Focus on core blog functionality before adding complex features like AI or auth

### Phase Approach

**Phase 1 (Now-ish)**
- Tailwind for styling
- Enhanced images
- Lucide icons
- Study other blogs for inspiration

**Phase 2 (Later)**
- Consider shadcn-svelte components
- Refine design based on learnings

**Phase 3 (Future)**
- User authentication
- Comments/likes system

**Phase 4 (Maybe)**
- AI features (only if there's a clear use case)

---

## Notes & Random Thoughts

- Website currently very basic - need to learn design principles
- Balance between feature richness and simplicity for a blog
- Cloudflare deployment considerations for any backend features

---

*Last updated: 2025-11-06*
