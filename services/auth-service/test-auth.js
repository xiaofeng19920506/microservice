const axios = require('axios');

const BASE_URL = 'http://localhost:12004';

async function testAuthService() {
  console.log('🧪 Testing Auth Service...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);
    console.log('');

    // Test 2: Register Regular User
    console.log('2. Testing User Registration...');
    const registerResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      isAdmin: false
    });
    console.log('✅ User Registration:', registerResponse.data.message);
    console.log('');

    // Test 3: Register Staff Member
    console.log('3. Testing Staff Registration...');
    const staffResponse = await axios.post(`${BASE_URL}/api/auth/register`, {
      name: 'Test Admin',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true,
      role: 'admin',
      department: 'IT',
      position: 'System Administrator',
      permissions: ['read', 'write', 'delete', 'admin']
    });
    console.log('✅ Staff Registration:', staffResponse.data.message);
    console.log('');

    // Test 4: Login as Regular User
    console.log('4. Testing User Login...');
    const userLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'test@example.com',
      password: 'password123',
      isAdmin: false
    });
    console.log('✅ User Login:', userLoginResponse.data.message);
    const userToken = userLoginResponse.data.data.accessToken;
    console.log('');

    // Test 5: Login as Staff
    console.log('5. Testing Staff Login...');
    const staffLoginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true
    });
    console.log('✅ Staff Login:', staffLoginResponse.data.message);
    const staffToken = staffLoginResponse.data.data.accessToken;
    console.log('');

    // Test 6: Get User Profile
    console.log('6. Testing Get Profile...');
    const profileResponse = await axios.get(`${BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Get Profile:', profileResponse.data.message);
    console.log('');

    // Test 7: Verify Token
    console.log('7. Testing Token Verification...');
    const verifyResponse = await axios.post(`${BASE_URL}/api/auth/verify`, {
      token: userToken
    });
    console.log('✅ Token Verification:', verifyResponse.data.message);
    console.log('');

    // Test 8: Refresh Token
    console.log('8. Testing Token Refresh...');
    const refreshResponse = await axios.post(`${BASE_URL}/api/auth/refresh`, {
      refreshToken: userLoginResponse.data.data.refreshToken
    });
    console.log('✅ Token Refresh:', refreshResponse.data.message);
    console.log('');

    // Test 9: Change Password
    console.log('9. Testing Change Password...');
    const changePasswordResponse = await axios.put(`${BASE_URL}/api/auth/change-password`, {
      currentPassword: 'password123',
      newPassword: 'newpassword123'
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Change Password:', changePasswordResponse.data.message);
    console.log('');

    // Test 10: Logout
    console.log('10. Testing Logout...');
    const logoutResponse = await axios.post(`${BASE_URL}/api/auth/logout`, {
      refreshToken: userLoginResponse.data.data.refreshToken
    });
    console.log('✅ Logout:', logoutResponse.data.message);
    console.log('');

    console.log('🎉 All Auth Service tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAuthService();
}

module.exports = testAuthService;
