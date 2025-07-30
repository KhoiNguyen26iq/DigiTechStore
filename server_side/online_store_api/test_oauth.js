// Tạo file test_oauth.js trong thư mục server để test

require('dotenv').config();
const { OAuth2Client } = require('google-auth-library');

async function testCredentials() {
  console.log('🧪 Testing OAuth Credentials...\n');
  
  // Test Google
  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    console.log('✅ Google credentials loaded successfully');
    console.log('Google Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...');
  } catch (error) {
    console.error('❌ Google credentials error:', error.message);
  }
  
  // Test Facebook
  try {
    if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
      console.log('✅ Facebook credentials loaded successfully');
      console.log('Facebook App ID:', process.env.FACEBOOK_APP_ID);
      console.log('Facebook App Secret:', process.env.FACEBOOK_APP_SECRET?.substring(0, 8) + '...');
    } else {
      console.error('❌ Missing Facebook credentials');
    }
  } catch (error) {
    console.error('❌ Facebook credentials error:', error.message);
  }
  
  console.log('\n🚀 Ready to test OAuth endpoints:');
  console.log('POST http://localhost:3000/users/auth/google');
  console.log('POST http://localhost:3000/users/auth/facebook');
}

testCredentials();