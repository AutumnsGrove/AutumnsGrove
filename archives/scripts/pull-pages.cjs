#!/usr/bin/env node

/**
 * Pull pages from D1 database back to UserContent files
 * Usage: node scripts/pull-pages.cjs [--local|--remote]
 *
 * This syncs D1 → Files (reverse of sync-pages.cjs)
 * Useful for backing up admin panel edits to version control
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const isRemote = args.includes('--remote');
const isLocal = args.includes('--local') || !isRemote;

const DB_NAME = 'autumnsgrove-posts';
const locationFlag = isRemote ? '--remote' : '--local';

console.log(`\n📥 Pulling pages from D1 database (${isRemote ? 'REMOTE' : 'LOCAL'}) to files...\n`);

// Page definitions
const PAGES = [
  {
    slug: 'home',
    dir: 'Home',
    file: 'home.md',
  },
  {
    slug: 'about',
    dir: 'About',
    file: 'about.md',
  },
  {
    slug: 'contact',
    dir: 'Contact',
    file: 'contact.md',
  }
];

const results = {
  pulled: 0,
  skipped: 0,
  errors: []
};

// Helper to execute wrangler D1 commands and get JSON output
function queryD1(sql) {
  try {
    const command = `wrangler d1 execute ${DB_NAME} --command "${sql.replace(/"/g, '\\"')}" ${locationFlag} --json`;
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });

    // Parse the JSON output from wrangler
    // Wrangler wraps the results in an array
    const parsed = JSON.parse(output);
    if (parsed && parsed[0] && parsed[0].results) {
      return parsed[0].results;
    }
    return [];
  } catch (error) {
    console.error(`❌ Query failed:`, error.message);
    return null;
  }
}

// Helper to convert page data to markdown file
function generateMarkdownFile(page) {
  let frontmatter = {
    title: page.title,
    description: page.description || ''
  };

  // Parse hero JSON if present
  if (page.hero) {
    try {
      frontmatter.hero = JSON.parse(page.hero);
    } catch (e) {
      console.warn(`⚠️  Failed to parse hero for ${page.slug}, skipping hero section`);
    }
  }

  // Parse font if not default
  if (page.font && page.font !== 'default') {
    frontmatter.font = page.font;
  }

  // Build YAML frontmatter
  let yaml = '---\n';
  yaml += `title: "${frontmatter.title.replace(/"/g, '\\"')}"\n`;

  if (frontmatter.description) {
    yaml += `description: "${frontmatter.description.replace(/"/g, '\\"')}"\n`;
  }

  if (frontmatter.hero) {
    yaml += 'hero:\n';
    yaml += `  title: "${frontmatter.hero.title.replace(/"/g, '\\"')}"\n`;
    yaml += `  subtitle: "${frontmatter.hero.subtitle.replace(/"/g, '\\"')}"\n`;
    if (frontmatter.hero.cta) {
      yaml += '  cta:\n';
      yaml += `    text: "${frontmatter.hero.cta.text.replace(/"/g, '\\"')}"\n`;
      yaml += `    link: "${frontmatter.hero.cta.link}"\n`;
    }
  }

  if (frontmatter.font) {
    yaml += `font: "${frontmatter.font}"\n`;
  }

  yaml += '---\n\n';

  // Add markdown content
  return yaml + page.markdown_content;
}

// Process each page
for (const pageConfig of PAGES) {
  try {
    console.log(`📄 Pulling ${pageConfig.slug}...`);

    // Query D1 for this page
    const results = queryD1(`SELECT slug, title, description, markdown_content, hero, font FROM pages WHERE slug = '${pageConfig.slug}'`);

    if (!results || results.length === 0) {
      console.log(`⚠️  ${pageConfig.slug} not found in D1, skipping`);
      results.skipped++;
      continue;
    }

    const page = results[0];

    // Generate markdown file content
    const markdownContent = generateMarkdownFile(page);

    // Write to file
    const filePath = path.join(__dirname, '..', 'UserContent', pageConfig.dir, pageConfig.file);

    // Ensure directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Check if file would change
    let hasChanges = true;
    if (fs.existsSync(filePath)) {
      const existing = fs.readFileSync(filePath, 'utf8');
      hasChanges = existing !== markdownContent;
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, markdownContent, 'utf8');
      console.log(`✅ ${pageConfig.slug} pulled successfully → ${filePath}`);
      results.pulled++;
    } else {
      console.log(`⏭️  ${pageConfig.slug} unchanged, skipping`);
      results.skipped++;
    }

  } catch (error) {
    console.error(`❌ Error processing ${pageConfig.slug}:`, error.message);
    results.errors.push({ page: pageConfig.slug, error: error.message });
  }
}

// Print summary
console.log('\n📊 Pull Summary:');
console.log(`  ✅ Pulled: ${results.pulled}`);
console.log(`  ⏭️  Skipped: ${results.skipped}`);
console.log(`  ❌ Errors: ${results.errors.length}`);

if (results.errors.length > 0) {
  console.log('\n⚠️  Errors:');
  results.errors.forEach(err => {
    console.log(`  - ${err.page}: ${err.error}`);
  });
  process.exit(1);
}

console.log('\n🎉 Pages pull completed successfully!\n');

if (results.pulled > 0) {
  console.log('💡 Tip: Review the changes and commit them to git:');
  console.log('   git diff');
  console.log('   git add UserContent/');
  console.log('   git commit -m "chore: sync pages from D1"');
  console.log('   git push\n');
}
