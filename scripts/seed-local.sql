-- AutumnsGrove local dev seed data
-- Run: wrangler d1 execute grove-engine-db --local --file=scripts/seed-local.sql

-- Schema (idempotent)
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  markdown_content TEXT,
  html_content TEXT,
  gutter_content TEXT DEFAULT '[]',
  tags TEXT DEFAULT '[]',
  status TEXT DEFAULT 'draft',
  font TEXT DEFAULT 'default',
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  type TEXT DEFAULT 'page',
  markdown_content TEXT,
  html_content TEXT,
  hero TEXT,
  gutter_content TEXT DEFAULT '[]',
  font TEXT DEFAULT 'default',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(tenant_id, slug)
);

CREATE TABLE IF NOT EXISTS site_settings (
  tenant_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  updated_at INTEGER,
  PRIMARY KEY(tenant_id, setting_key)
);

-- Clear existing seed data
DELETE FROM posts WHERE tenant_id = 'autumn-primary';
DELETE FROM pages WHERE tenant_id = 'autumn-primary';
DELETE FROM site_settings WHERE tenant_id = 'autumn-primary';

-- Home page
INSERT INTO pages (id, tenant_id, slug, title, description, type, html_content, hero, created_at, updated_at)
VALUES (
  'page-home',
  'autumn-primary',
  'home',
  'Autumns Grove',
  'A place for words, projects, and quiet thoughts.',
  'page',
  '<p>Welcome to the grove. This is a little corner of the internet where I write about building software, share what I''m learning, and think out loud about the things that matter to me.</p><p>Pull up a chair, pour some tea, and stay a while.</p>',
  '{"title": "Autumns Grove", "subtitle": "a place for words, projects, and quiet thoughts.", "cta": {"text": "Read the blog", "link": "/blog"}}',
  1719446400, 1719446400
);

-- About page
INSERT INTO pages (id, tenant_id, slug, title, description, type, html_content, created_at, updated_at)
VALUES (
  'page-about',
  'autumn-primary',
  'about',
  'About',
  'Who I am and what I build.',
  'page',
  '<p>I''m Autumn — a developer, writer, and builder of things on the internet. I care deeply about craft, accessibility, and making software that feels like home.</p><p>This site is built with SvelteKit, runs on Cloudflare Workers, and stores everything in D1. No frameworks borrowed — every component written from scratch.</p><h2 id="what-i-build">What I build</h2><p>I work across the stack: frontend interfaces, backend APIs, infrastructure tooling, and the glue that holds it all together. My current focus is on the <strong>Grove ecosystem</strong> — a collection of tools for personal websites and creative publishing.</p><h2 id="get-in-touch">Get in touch</h2><p>You can find me on <a href="https://github.com/AutumnsGrove">GitHub</a> or reach out through the <a href="/contact">contact page</a>.</p>',
  1719446400, 1719446400
);

-- Blog post 1: with Vines gutter content
INSERT INTO posts (id, tenant_id, slug, title, description, markdown_content, html_content, gutter_content, tags, status, published_at, created_at, updated_at)
VALUES (
  'post-001',
  'autumn-primary',
  'rebuilding-from-scratch',
  'Rebuilding from scratch',
  'Why I tore down my site and started over, and what I learned along the way.',
  '## The old site

The previous version of this site was built on top of Lattice, my own UI framework. It worked, but it never quite felt like *mine*. Every page looked like a tenant of a larger system, because that''s exactly what it was.

## The decision

I wanted something that felt handmade. Something with its own colors, its own typography, its own personality. So I archived everything and started fresh.

## What stayed

The infrastructure stayed — D1 database, Cloudflare Workers, GroveAuth for login. These are solid foundations. Everything above them got rebuilt.

## What changed

Custom CSS with oklch colors. Lora headings. An amber-and-plum palette that feels like a midnight tea shop. A simplified Vines system for sidebar annotations. A markdown editor that does exactly what I need and nothing more.

## Looking forward

There''s still work to do — better mobile layouts, a proper image pipeline, maybe a guestbook. But the foundation is solid, and for the first time, this site feels like home.',
  '<h2 id="the-old-site">The old site</h2><p>The previous version of this site was built on top of Lattice, my own UI framework. It worked, but it never quite felt like <em>mine</em>. Every page looked like a tenant of a larger system, because that''s exactly what it was.</p><h2 id="the-decision">The decision</h2><p>I wanted something that felt handmade. Something with its own colors, its own typography, its own personality. So I archived everything and started fresh.</p><h2 id="what-stayed">What stayed</h2><p>The infrastructure stayed — D1 database, Cloudflare Workers, GroveAuth for login. These are solid foundations. Everything above them got rebuilt.</p><h2 id="what-changed">What changed</h2><p>Custom CSS with oklch colors. Lora headings. An amber-and-plum palette that feels like a midnight tea shop. A simplified Vines system for sidebar annotations. A markdown editor that does exactly what I need and nothing more.</p><h2 id="looking-forward">Looking forward</h2><p>There''s still work to do — better mobile layouts, a proper image pipeline, maybe a guestbook. But the foundation is solid, and for the first time, this site feels like home.</p>',
  '[{"type":"comment","anchor":"## The old site","content":"<p>This is a gutter annotation! These appear alongside the content they reference, like margin notes in a book.</p>"},{"type":"comment","anchor":"## What changed","content":"<p>The color palette uses <strong>oklch()</strong> — perceptually uniform color space. Dark mode colors look equally vibrant instead of washed out.</p>"},{"type":"image","anchor":"## Looking forward","src":"https://cdn.autumnsgrove.com/photos/2025/11/21/night_sky_with_scattered_stars_and_faint_cloudy_fo_2e15239b.webp","caption":"the grove at night"}]',
  '["meta","svelte","rebuild"]',
  'published',
  1719532800, 1719532800, 1719532800
);

-- Blog post 2: simple post without vines
INSERT INTO posts (id, tenant_id, slug, title, description, markdown_content, html_content, tags, status, published_at, created_at, updated_at)
VALUES (
  'post-002',
  'autumn-primary',
  'on-writing-code-that-feels-like-home',
  'On writing code that feels like home',
  'Thoughts on craft, warmth, and the software we choose to build.',
  '## Craft matters

There''s a difference between code that works and code that feels right. Both compile. Both pass tests. But one of them you want to come back to.

I think about this a lot when building personal projects. Nobody is paying me to make this site beautiful. Nobody will notice if the border radius is 4px or 6px. But *I* notice. And that matters.

## The warmth of constraints

Constraints are generative. When I decided to use only CSS custom properties — no Tailwind, no component library — it forced me to think about every color, every spacing value, every transition. The result is a design system that fits like a glove because it was shaped by hand.

## Building for yourself

The best personal sites I''ve seen are unapologetically *personal*. They don''t follow trends. They don''t look like a template. They reflect the person who made them.

That''s what I''m trying to do here.',
  '<h2 id="craft-matters">Craft matters</h2><p>There''s a difference between code that works and code that feels right. Both compile. Both pass tests. But one of them you want to come back to.</p><p>I think about this a lot when building personal projects. Nobody is paying me to make this site beautiful. Nobody will notice if the border radius is 4px or 6px. But <em>I</em> notice. And that matters.</p><h2 id="the-warmth-of-constraints">The warmth of constraints</h2><p>Constraints are generative. When I decided to use only CSS custom properties — no Tailwind, no component library — it forced me to think about every color, every spacing value, every transition. The result is a design system that fits like a glove because it was shaped by hand.</p><h2 id="building-for-yourself">Building for yourself</h2><p>The best personal sites I''ve seen are unapologetically <em>personal</em>. They don''t follow trends. They don''t look like a template. They reflect the person who made them.</p><p>That''s what I''m trying to do here.</p>',
  '["thoughts","craft","css"]',
  'published',
  1719619200, 1719619200, 1719619200
);

-- Blog post 3: draft post
INSERT INTO posts (id, tenant_id, slug, title, description, markdown_content, html_content, tags, status, created_at, updated_at)
VALUES (
  'post-003',
  'autumn-primary',
  'wip-grove-ecosystem',
  'The Grove ecosystem (WIP)',
  'A draft overview of all the pieces that make up Grove.',
  'This is a draft. Still working on it.',
  '<p>This is a draft. Still working on it.</p>',
  '["grove","architecture"]',
  'draft',
  1719705600, 1719705600
);

-- Site settings
INSERT INTO site_settings (tenant_id, setting_key, setting_value, updated_at)
VALUES ('autumn-primary', 'site_title', 'Autumns Grove', 1719446400);

INSERT INTO site_settings (tenant_id, setting_key, setting_value, updated_at)
VALUES ('autumn-primary', 'site_description', 'A place for words, projects, and quiet thoughts.', 1719446400);
