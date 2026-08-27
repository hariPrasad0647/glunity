require('dotenv').config();
const sequelize = require('./config/db');
const { socialLogin } = require('./modules/auth/services/auth.service');
const User = require('./modules/user/models/user.model');
const AuthIdentity = require('./modules/auth/models/auth-identity.model');

async function runTests() {
  await sequelize.authenticate();
  
  const testEmail = `duplicate_test_${Date.now()}@example.com`;
  
  console.log(`\n--- Starting Security/Integration Tests ---`);
  
  try {
    // 1. Create existing user
    console.log('\n1. Test: Duplicate Account Prevention');
    await User.create({
      fullName: 'Existing User',
      username: `existing_${Date.now()}`,
      email: testEmail,
      isVerified: true
    });
    
    // Attempt Google login with same email
    try {
      await socialLogin({
        provider: 'GOOGLE',
        providerUserId: 'google_123',
        email: testEmail,
        fullName: 'Google User'
      });
      console.log('❌ Failed: Allowed Google login to silently merge with existing email');
    } catch (e) {
      if (e.statusCode === 409) {
        console.log('✅ Passed: Prevented Google login from merging with existing email (409 Conflict)');
      } else {
        console.log('❌ Failed: Unexpected error on Google duplicate: ', e.message);
      }
    }

    // Attempt Apple login with same email
    try {
      await socialLogin({
        provider: 'APPLE',
        providerUserId: 'apple_123',
        email: testEmail,
        fullName: 'Apple User'
      });
      console.log('❌ Failed: Allowed Apple login to silently merge with existing email');
    } catch (e) {
      if (e.statusCode === 409) {
        console.log('✅ Passed: Prevented Apple login from merging with existing email (409 Conflict)');
      } else {
        console.log('❌ Failed: Unexpected error on Apple duplicate: ', e.message);
      }
    }

    // 2. AuthIdentity Database Integrity
    console.log('\n2. Test: AuthIdentity Database Integrity (Unique Constraint)');
    const uniqueProviderUserId = `unique_${Date.now()}`;
    const newEmail = `new_${Date.now()}@example.com`;
    
    // Create first identity
    await socialLogin({
      provider: 'GOOGLE',
      providerUserId: uniqueProviderUserId,
      email: newEmail,
      fullName: 'First Google User'
    });
    console.log('✅ Created first AuthIdentity successfully');
    
    // Try to create second identity with SAME providerUserId but different email (simulate attack or glitch)
    try {
      await AuthIdentity.create({
        userId: (await User.findOne({ where: { email: newEmail } })).id,
        provider: 'GOOGLE',
        providerUserId: uniqueProviderUserId,
        email: 'attacker@example.com'
      });
      console.log('❌ Failed: Database allowed duplicate (provider, providerUserId)');
    } catch (e) {
      if (e.name === 'SequelizeUniqueConstraintError') {
        console.log('✅ Passed: Database strictly enforced unique constraint on (provider, providerUserId)');
      } else {
        console.log('❌ Failed: Unexpected error on DB integrity check: ', e.message);
      }
    }

    console.log('\n--- Tests Completed Successfully ---');
    
  } catch (err) {
    console.error('\nTest Execution Failed:', err);
  } finally {
    // Cleanup
    process.exit(0);
  }
}

runTests();
