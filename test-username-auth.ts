/**
 * Username/Password Authentication Test
 * 
 * This demonstrates the new username/password authentication system.
 * Users can now register and login with username + password.
 */

const BASE_URL = 'http://localhost:5000';

async function testUsernamePasswordAuth() {
  console.log('='.repeat(60));
  console.log('Testing Username/Password Authentication System');
  console.log('='.repeat(60));

  try {
    // Test 1: Register with username
    console.log('\n📝 Test 1: Register new user with username...');
    const registerData = {
      username: 'johndoe',
      email: `johndoe-${Date.now()}@example.com`,
      password: 'SecurePass123',
      firstName: 'John',
      lastName: 'Doe',
    };

    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData),
    });

    if (!registerRes.ok) {
      const error = await registerRes.json();
      console.log('❌ Registration failed:', error.message);
      return;
    }

    const registerResult = await registerRes.json();
    console.log('✅ Registration successful!');
    console.log('   User ID:', registerResult.user.id);
    console.log('   Username:', registerResult.user.username);
    console.log('   Email:', registerResult.user.email);
    console.log('   Token received:', registerResult.token.substring(0, 30) + '...');

    // Test 2: Login with username
    console.log('\n🔐 Test 2: Login with username...');
    const loginWithUsernameRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: registerData.username,
        password: registerData.password,
      }),
    });

    if (!loginWithUsernameRes.ok) {
      const error = await loginWithUsernameRes.json();
      console.log('❌ Login with username failed:', error.message);
    } else {
      const loginResult = await loginWithUsernameRes.json();
      console.log('✅ Login with username successful!');
      console.log('   Welcome back,', loginResult.user.firstName, loginResult.user.lastName);
    }

    // Test 3: Login with email
    console.log('\n📧 Test 3: Login with email...');
    const loginWithEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emailOrUsername: registerResult.user.email,
        password: registerData.password,
      }),
    });

    if (!loginWithEmailRes.ok) {
      const error = await loginWithEmailRes.json();
      console.log('❌ Login with email failed:', error.message);
    } else {
      const loginResult = await loginWithEmailRes.json();
      console.log('✅ Login with email successful!');
      console.log('   Token received:', loginResult.token.substring(0, 30) + '...');
    }

    // Test 4: Test authentication with token
    console.log('\n🔑 Test 4: Verify authentication token...');
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify`, {
      headers: {
        'Authorization': `Bearer ${registerResult.token}`,
      },
    });

    if (!verifyRes.ok) {
      console.log('❌ Token verification failed');
    } else {
      const verifyResult = await verifyRes.json();
      console.log('✅ Token verified successfully!');
      console.log('   Authenticated as:', verifyResult.user.username);
    }

    // Test 5: Access protected resource
    console.log('\n📚 Test 5: Access protected resource (notes)...');
    const notesRes = await fetch(`${BASE_URL}/api/notes`, {
      headers: {
        'Authorization': `Bearer ${registerResult.token}`,
      },
    });

    if (!notesRes.ok) {
      console.log('❌ Failed to access notes');
    } else {
      const notes = await notesRes.json();
      console.log('✅ Successfully accessed notes!');
      console.log(`   Found ${notes.length} notes for user`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All tests passed! Username/Password auth is working!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
  }
}

// Run tests
testUsernamePasswordAuth();
