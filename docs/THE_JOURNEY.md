# The Journey: From "I Want a Blog" to SaaS Platform in 2 Weeks

## Timeline

**May 2025**: Graduated with IT/Cybersecurity degree
**November 2025**: Still unemployed, working retail, living in parents' basement, depressed

**Day 1**: "I want a domain"
**Day 2**: "I want to host images" → Discovered `cdn.autumnsgrove.com`
**Day 3**: "What if subdomains could scale?" → Wanted `autumn.grove.place`
**Days 4-6**: Manual domain searching (failed)
**Day 7**: Built AI domain-hunting agent, deployed it during work shift
**Lunch break**: Found `grove.place` for $17. Instant tagline: "Get your place in the Grove"
**That afternoon**: Full project spec, GitHub repo, 25 commits
**Next day**: Personal website live at autumnsgrove.com
**2 days later**: Landing page live at grove.place
**Week 2**: Migrated to shadcn/svelte components, added gallery, built multi-tenant architecture

## The Business Model

### Core Insight
Nobody wants generic blogging platforms. Neurodivergent folks especially hate them. They're expensive ($10-20/month), inflexible, and don't feel like *yours*.

### Solution: Sell Infrastructure, Not Labor

**Pricing Tiers**:
- **Base**: Subdomain blog - $20 one-time OR $5/month
- **Premium**: Advanced features - $24.99/month
- **Custom Domain**: Full control - $250-400 setup + $50/month
- **Add-ons**: Comments, galleries, shops - $50 setup + $5/month each

**Dynamic Pricing for Domain Services**:
- Next day delivery: $400
- 3-day delivery: $300
- 1-week delivery: $250
- (Run search immediately, upsell cheaper tiers mid-wait)

### Economics

**Server Costs** (Cloudflare):
- 0-100 users: **$0/month**
- 100-2,000 users: **$5/month**
- 2,000+ users: **$20/month**

**Revenue at 2,000 Users**:
- 25% premium adoption (500 users × $24.99) = **$12,495/month**
- 1/16 custom shops (125 users × $50/month) = **$6,250/month**
- Total MRR: **~$13,745/month** (minus $20 costs)

**Current salary**: $1,100/month
**Potential**: 12x current income at scale

### Why It Works

1. **You are the market**: Built for neurodivergent folks who hate existing platforms
2. **Passive income**: Once setup, runs autonomously
3. **Scales cheaper than it grows**: Costs grow logarithmically, revenue grows linearly
4. **Multiple revenue streams**: Setup fees + recurring + add-ons
5. **Low barrier to entry**: $5/month base tier, upgrade as needed
6. **Queer-friendly infrastructure**: Safe digital space, especially valuable in hostile physical environments

## Technical Achievement

Built in a framework (SvelteKit) never used before, in 2 weeks:
- Multi-tenant architecture
- User authentication
- Custom domain routing
- R2 cloud storage
- Admin panel
- Security (XSS, CSRF, file validation)
- 181 security tests
- CI/CD pipeline
- GitHub integration
- Timeline features
- Blog + recipes + gallery
- Markdown + Mermaid diagrams

**All using AI coding tools to focus on WHAT to build, not HOW.**

## The Tools That Made This Possible

- **Claude Code**: Primary coding agent
- **AgentBench**: Web-accessible autonomous agent (ran domain search)
- **AI domain hunter**: Custom tool that ran 4 hours, found `grove.place` for $17
- **Agentic workflow**: Plan → spawn agents → review → deploy

## Key Insight

This isn't "AI replacing developers" - it's **AI creating developers**.

Someone with no SvelteKit experience built a production SaaS platform in 2 weeks because the barrier between *idea* and *implementation* collapsed.

The work shifted from:
- Writing code → Orchestrating agents
- Fighting syntax → Building vision
- Hours for dollars → Scalable infrastructure

## Philosophy: Build in the Open

Everything is public on GitHub because:
1. Social proof as you build
2. Portfolio for recruiters/investors
3. Community building from day one
4. Transparency builds trust
5. Shows what's possible with AI tools

## On Ethics

Could easily lock customers in with data traps. Could be predatory with pricing. Could hide costs.

**Instead**: Be genuine. Be honest. Be transparent. Build infrastructure that *helps* people.

The money comes from providing value, not exploitation.

## What's Next

- Launch grove.place to first customers
- Iterate based on feedback
- Scale server infrastructure as needed
- Add requested features (comments, shops, etc.)
- Build sustainable passive income
- Quit retail job
- Keep building in public

---

*Written November 2025, documenting a 2-week journey from unemployment depression to SaaS founder.*

*All because I wanted a blog.*
