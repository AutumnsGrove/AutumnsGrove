#!/usr/bin/env node

/**
 * Sync pages from UserContent to D1 database
 * Usage: node scripts/sync-pages.js [--local|--remote]
 *
 * Pages are read from:
 * - UserContent/Home/home.md
 * - UserContent/About/about.md
 * - UserContent/Contact/contact.md
 *
 * And synced to the 'pages' table in D1
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { marked } = require('marked');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const isRemote = args.includes('--remote');
const isLocal = args.includes('--local') || !isRemote;

const DB_NAME = 'autumnsgrove-posts';
const locationFlag = isRemote ? '--remote' : '--local';

console.log(`\n🔄 Syncing pages to D1 database (${isRemote ? 'REMOTE' : 'LOCAL'})...\n`);

// Page definitions
const PAGES = [
  {
    slug: 'home',
    dir: 'Home',
    file: 'home.md',
    type: 'page'
  },
  {
    slug: 'about',
    dir: 'About',
    file: 'about.md',
    type: 'page'
  },
  {
    slug: 'contact',
    dir: 'Contact',
    file: 'contact.md',
    type: 'page'
  }
];

const results = {
  synced: 0,
  skipped: 0,
  errors: []
};

// Helper to escape SQL strings
function escapeSql(str) {
  if (!str) return '';
  return str.replace(/'/g, "''");
}

// Helper to generate hash
function generateHash(content) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(content).digest('hex');
}

// Helper to execute wrangler D1 commands using a temp file
function executeD1Command(sql, description) {
  const tmpFile = path.join(__dirname, '.tmp-sync.sql');
  try {
    // Write SQL to temp file
    fs.writeFileSync(tmpFile, sql, 'utf8');

    // Execute using --file flag
    const command = `wrangler d1 execute ${DB_NAME} --file="${tmpFile}" ${locationFlag}`;
    execSync(command, { stdio: 'inherit' });

    // Clean up temp file
    fs.unlinkSync(tmpFile);
    return true;
  } catch (error) {
    // Clean up temp file on error
    if (fs.existsSync(tmpFile)) {
      fs.unlinkSync(tmpFile);
    }
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Process each page
for (const page of PAGES) {
  try {
    const pagePath = path.join(__dirname, '..', 'UserContent', page.dir, page.file);

    // Check if file exists
    if (!fs.existsSync(pagePath)) {
      console.log(`⚠️  Skipping ${page.slug}: file not found at ${pagePath}`);
      results.skipped++;
      continue;
    }

    // Read and parse the file
    const content = fs.readFileSync(pagePath, 'utf8');
    const { data, content: markdown } = matter(content);

    // Generate HTML from markdown
    const htmlContent = marked.parse(markdown);

    // Prepare page data
    const title = escapeSql(data.title || page.slug.charAt(0).toUpperCase() + page.slug.slice(1));
    const description = escapeSql(data.description || '');
    const markdownEscaped = escapeSql(markdown);
    const htmlEscaped = escapeSql(htmlContent);

    // Handle hero section (JSON)
    let heroValue = 'NULL';
    if (data.hero) {
      const heroJson = JSON.stringify(data.hero);
      heroValue = `'${escapeSql(heroJson)}'`;
    }

    // Handle gutter content (default to empty array)
    const gutterContent = '[]';

    // Font setting
    const font = data.font || 'default';

    // Create INSERT OR REPLACE SQL
    const sql = `INSERT OR REPLACE INTO pages (slug, title, description, type, markdown_content, html_content, hero, gutter_content, font) VALUES ('${page.slug}', '${title}', '${description}', '${page.type}', '${markdownEscaped}', '${htmlEscaped}', ${heroValue}, '${gutterContent}', '${font}');`;

    // Execute the SQL
    console.log(`📄 Syncing ${page.slug}...`);

    const success = executeD1Command(sql, `Sync ${page.slug}`);

    if (success) {
      console.log(`✅ ${page.slug} synced successfully`);
      results.synced++;
    } else {
      results.errors.push({ page: page.slug, error: 'Failed to execute SQL' });
    }

  } catch (error) {
    console.error(`❌ Error processing ${page.slug}:`, error.message);
    results.errors.push({ page: page.slug, error: error.message });
  }
}

// Print summary
console.log('\n📊 Sync Summary:');
console.log(`  ✅ Synced: ${results.synced}`);
console.log(`  ⏭️  Skipped: ${results.skipped}`);
console.log(`  ❌ Errors: ${results.errors.length}`);

if (results.errors.length > 0) {
  console.log('\n⚠️  Errors:');
  results.errors.forEach(err => {
    console.log(`  - ${err.page}: ${err.error}`);
  });
  process.exit(1);
}

console.log('\n🎉 Pages sync completed successfully!\n');
