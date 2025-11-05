// Generate a secure API key for the sync endpoint
const crypto = require('crypto');

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

console.log('Generated API Key:', generateApiKey());
console.log('\nTo set this as a secret in your worker:');
console.log('wrangler secret put SYNC_API_KEY');
console.log('Then enter the key above when prompted.');