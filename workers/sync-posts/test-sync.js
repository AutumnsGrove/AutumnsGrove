// Test script for the CloudFlare Worker sync functionality
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Configuration
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8787';
const API_KEY = process.env.SYNC_API_KEY || 'test-key';

async function testSync() {
  console.log('🧪 Testing CloudFlare Worker sync functionality...\n');

  try {
    // Read test posts from the main posts directory
    const postsDir = path.join(__dirname, '../../posts');
    const files = fs.readdirSync(postsDir).filter(file => file.endsWith('.md'));
    
    const posts = [];
    
    for (const file of files) {
      const filePath = path.join(postsDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const slug = file.replace('.md', '');
      
      posts.push({
        slug,
        content
      });
    }

    console.log(`📖 Found ${posts.length} posts to sync`);
    console.log('📋 Post slugs:', posts.map(p => p.slug).join(', '));

    // Test the sync endpoint
    console.log('\n🔄 Testing sync endpoint...');
    const syncResponse = await fetch(`${WORKER_URL}/sync`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(posts)
    });

    const syncResult = await syncResponse.json();
    
    if (syncResponse.ok) {
      console.log('✅ Sync successful!');
      console.log(`📊 Synced: ${syncResult.synced} posts`);
      
      if (syncResult.details && syncResult.details.length > 0) {
        console.log('\n📋 Sync details:');
        syncResult.details.forEach(detail => {
          console.log(`  - ${detail.slug}: ${detail.action}`);
        });
      }
      
      if (syncResult.errors && syncResult.errors.length > 0) {
        console.log('\n⚠️  Errors:');
        syncResult.errors.forEach(error => {
          console.log(`  - ${error.slug || 'general'}: ${error.error}`);
        });
      }
    } else {
      console.log('❌ Sync failed!');
      console.log('Error:', syncResult);
      return;
    }

    // Test the get all posts endpoint
    console.log('\n📚 Testing get all posts endpoint...');
    const getAllResponse = await fetch(`${WORKER_URL}/posts`);
    const allPosts = await getAllResponse.json();
    
    if (getAllResponse.ok) {
      console.log(`✅ Retrieved ${allPosts.length} posts`);
      console.log('📋 Post titles:', allPosts.map(p => p.title).join(', '));
    } else {
      console.log('❌ Failed to get posts!');
      console.log('Error:', allPosts);
    }

    // Test getting a specific post
    if (allPosts.length > 0) {
      const testSlug = allPosts[0].slug;
      console.log(`\n📄 Testing get single post endpoint (${testSlug})...`);
      const getSingleResponse = await fetch(`${WORKER_URL}/posts/${testSlug}`);
      const singlePost = await getSingleResponse.json();
      
      if (getSingleResponse.ok) {
        console.log('✅ Retrieved post successfully!');
        console.log(`📋 Title: ${singlePost.title}`);
        console.log(`📅 Date: ${singlePost.date}`);
        console.log(`🏷️  Tags: ${JSON.parse(singlePost.tags || '[]').join(', ')}`);
        console.log(`📝 Content length: ${singlePost.markdown_content.length} characters`);
      } else {
        console.log('❌ Failed to get post!');
        console.log('Error:', singlePost);
      }
    }

    // Test health endpoint
    console.log('\n🏥 Testing health endpoint...');
    const healthResponse = await fetch(`${WORKER_URL}/health`);
    if (healthResponse.ok) {
      console.log('✅ Health check passed!');
    } else {
      console.log('❌ Health check failed!');
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testSync().catch(console.error);
}

module.exports = { testSync };