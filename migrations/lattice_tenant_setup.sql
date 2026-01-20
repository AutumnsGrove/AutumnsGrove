-- =============================================================================
-- Lattice Tenant Setup: autumn.grove.place
-- =============================================================================
-- Run this against the Lattice/GroveEngine D1 database to provision the tenant
--
-- Usage:
--   wrangler d1 execute lattice-engine --file=migrations/lattice_tenant_setup.sql
--
-- This creates:
--   1. The "autumn" tenant with evergreen plan
--   2. Home and About pages
--   3. Timeline curio configuration
-- =============================================================================

-- =============================================================================
-- 1. CREATE TENANT
-- =============================================================================

INSERT INTO tenants (
    id,
    subdomain,
    display_name,
    email,
    plan,
    custom_domain,
    theme,
    active,
    created_at,
    updated_at
) VALUES (
    'tenant_autumn',
    'autumn',
    'Autumn''s Grove',
    'autumn@grove.place',
    'evergreen',
    'autumnsgrove.com',
    'default',
    1,
    unixepoch(),
    unixepoch()
) ON CONFLICT(id) DO UPDATE SET
    display_name = excluded.display_name,
    email = excluded.email,
    plan = excluded.plan,
    custom_domain = excluded.custom_domain,
    updated_at = unixepoch();

-- =============================================================================
-- 2. CREATE HOME PAGE
-- =============================================================================

INSERT INTO pages (
    id,
    tenant_id,
    slug,
    title,
    description,
    markdown_content,
    html_content,
    hero,
    gutter_content,
    created_at,
    updated_at
) VALUES (
    'autumn-page-home',
    'tenant_autumn',
    'home',
    'Home',
    'A quiet corner of the internet where thoughts grow slowly.',
    '## A Place to Be

This is my personal grove—a space for sharing thoughts, projects, and the occasional recipe. No algorithms. No engagement metrics. Just a place where ideas can grow at their own pace.

## What''s Growing Here

- **Blog** - Thoughts on code, creativity, and life
- **Timeline** - Daily development summaries, AI-powered insights into what I''m building
- **[The Workshop](https://grove.place/roadmap/workshop)** - The larger ecosystem I''m building

*Pull up a chair. Stay a while.*',
    '<h2>A Place to Be</h2>
<p>This is my personal grove—a space for sharing thoughts, projects, and the occasional recipe. No algorithms. No engagement metrics. Just a place where ideas can grow at their own pace.</p>
<h2>What''s Growing Here</h2>
<ul>
<li><strong>Blog</strong> - Thoughts on code, creativity, and life</li>
<li><strong>Timeline</strong> - Daily development summaries, AI-powered insights into what I''m building</li>
<li><strong><a href="https://grove.place/roadmap/workshop">The Workshop</a></strong> - The larger ecosystem I''m building</li>
</ul>
<p><em>Pull up a chair. Stay a while.</em></p>',
    '{"title":"Autumn''s Grove","subtitle":"A quiet corner of the internet where thoughts grow slowly.","cta":{"text":"Read the Blog","link":"/blog"}}',
    '[]',
    unixepoch(),
    unixepoch()
) ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    description = excluded.description,
    markdown_content = excluded.markdown_content,
    html_content = excluded.html_content,
    hero = excluded.hero,
    updated_at = unixepoch();

-- =============================================================================
-- 3. CREATE ABOUT PAGE
-- =============================================================================

INSERT INTO pages (
    id,
    tenant_id,
    slug,
    title,
    description,
    markdown_content,
    html_content,
    hero,
    gutter_content,
    created_at,
    updated_at
) VALUES (
    'autumn-page-about',
    'tenant_autumn',
    'about',
    'About',
    'A little corner of the internet where I plant thoughts and watch them grow',
    '<div style="text-align: center; margin-bottom: 2rem;">
  <img src="https://cdn.grove.place/profile-mjxaqbpu.jpeg" alt="Photo of Autumn" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid hsl(142, 76%, 36%); box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
</div>

## Hey, I''m Autumn

This is my little grove on the internet—a quiet space where I plant thoughts and watch them grow. Not for algorithms. Not for metrics. Just for the quiet joy of making something that feels like home.

I write code, cook elaborate meals, and believe the web should still have spaces that feel personal and warm. The kind of place where conversations happen in the margins of borrowed books, where the tea is always steeping, and where you don''t have to perform for anyone.

---

## Why I Built This

Remember when the internet felt personal? When you had your little corner of it. When you weren''t performing for an algorithm.

I got tired of watching friends get trapped in dopamine slot machines designed to exploit neurodivergent minds. I got tired of platforms that treat your words as training data. So I started building differently.

This site—and the [larger Grove ecosystem](https://grove.place) I''m creating—is my attempt to carve out something better. A forest of voices where people can just... write. Exist. Be.

Autumn''s Grove is the personal tree in that forest. The one I tend myself.

---

## What You''ll Find Here

### Blog Posts

Thoughts on technology, programming, and life. Sometimes technical, sometimes introspective, always honest. I write because processing in public helps me think, and maybe it''ll help someone else too.

### Timeline

My [Timeline](/timeline) is powered by AI—it watches my GitHub activity and generates daily summaries of what I''m building. A transparent window into the work.

### The Bigger Picture

I''m building [Grove](https://grove.place)—a platform for writers who want a home on the internet without the surveillance. Check out the [workshop](https://grove.place/roadmap/workshop) to see what tools are being crafted.

---

## Let''s Connect

I''d genuinely love to hear from you—questions, feedback, or just to say hi.

Found a bug? Have an idea? [Open an issue](https://github.com/AutumnsGrove/AutumnsGrove/issues) and let''s fix it together.

---

*Thanks for visiting. Pull up a chair, stay a while.*',
    '<div style="text-align: center; margin-bottom: 2rem;">
  <img src="https://cdn.grove.place/profile-mjxaqbpu.jpeg" alt="Photo of Autumn" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 3px solid hsl(142, 76%, 36%); box-shadow: 0 4px 12px rgba(0,0,0,0.1);" />
</div>
<h2>Hey, I''m Autumn</h2>
<p>This is my little grove on the internet—a quiet space where I plant thoughts and watch them grow. Not for algorithms. Not for metrics. Just for the quiet joy of making something that feels like home.</p>
<p>I write code, cook elaborate meals, and believe the web should still have spaces that feel personal and warm. The kind of place where conversations happen in the margins of borrowed books, where the tea is always steeping, and where you don''t have to perform for anyone.</p>
<hr>
<h2>Why I Built This</h2>
<p>Remember when the internet felt personal? When you had your little corner of it. When you weren''t performing for an algorithm.</p>
<p>I got tired of watching friends get trapped in dopamine slot machines designed to exploit neurodivergent minds. I got tired of platforms that treat your words as training data. So I started building differently.</p>
<p>This site—and the <a href="https://grove.place">larger Grove ecosystem</a> I''m creating—is my attempt to carve out something better. A forest of voices where people can just... write. Exist. Be.</p>
<p>Autumn''s Grove is the personal tree in that forest. The one I tend myself.</p>
<hr>
<h2>What You''ll Find Here</h2>
<h3>Blog Posts</h3>
<p>Thoughts on technology, programming, and life. Sometimes technical, sometimes introspective, always honest. I write because processing in public helps me think, and maybe it''ll help someone else too.</p>
<h3>Timeline</h3>
<p>My <a href="/timeline">Timeline</a> is powered by AI—it watches my GitHub activity and generates daily summaries of what I''m building. A transparent window into the work.</p>
<h3>The Bigger Picture</h3>
<p>I''m building <a href="https://grove.place">Grove</a>—a platform for writers who want a home on the internet without the surveillance. Check out the <a href="https://grove.place/roadmap/workshop">workshop</a> to see what tools are being crafted.</p>
<hr>
<h2>Let''s Connect</h2>
<p>I''d genuinely love to hear from you—questions, feedback, or just to say hi.</p>
<p>Found a bug? Have an idea? <a href="https://github.com/AutumnsGrove/AutumnsGrove/issues">Open an issue</a> and let''s fix it together.</p>
<hr>
<p><em>Thanks for visiting. Pull up a chair, stay a while.</em></p>',
    NULL,
    '[]',
    unixepoch(),
    unixepoch()
) ON CONFLICT(id) DO UPDATE SET
    title = excluded.title,
    description = excluded.description,
    markdown_content = excluded.markdown_content,
    html_content = excluded.html_content,
    updated_at = unixepoch();

-- =============================================================================
-- 4. ENABLE TIMELINE CURIO
-- =============================================================================
-- Note: API keys need to be added separately via admin UI or manual update
-- The github_token_encrypted and openrouter_key_encrypted fields require
-- application-layer encryption

INSERT INTO timeline_curio_config (
    tenant_id,
    enabled,
    github_username,
    openrouter_model,
    voice_preset,
    timezone,
    owner_name,
    repos_exclude,
    created_at,
    updated_at
) VALUES (
    'tenant_autumn',
    1,
    'AutumnsGrove',
    'deepseek/deepseek-chat',
    'quest',
    'America/New_York',
    'Autumn',
    '["dotfiles", ".github"]',
    unixepoch(),
    unixepoch()
) ON CONFLICT(tenant_id) DO UPDATE SET
    enabled = excluded.enabled,
    github_username = excluded.github_username,
    openrouter_model = excluded.openrouter_model,
    voice_preset = excluded.voice_preset,
    timezone = excluded.timezone,
    owner_name = excluded.owner_name,
    repos_exclude = excluded.repos_exclude,
    updated_at = unixepoch();

-- =============================================================================
-- 5. VERIFICATION QUERIES
-- =============================================================================
-- Uncomment these to verify the setup worked:

-- SELECT id, subdomain, display_name, plan FROM tenants WHERE id = 'tenant_autumn';
-- SELECT id, slug, title FROM pages WHERE tenant_id = 'tenant_autumn';
-- SELECT tenant_id, enabled, github_username, voice_preset FROM timeline_curio_config WHERE tenant_id = 'tenant_autumn';
