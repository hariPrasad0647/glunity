require('dotenv').config();
const sequelize = require('./config/db');
const { signup, verifyOtp, resendOtp, requestLogin, verifyLogin, ApiError } = require('./modules/auth/services/auth.service');
const Otp = require('./modules/auth/models/otp.model');
const User = require('./modules/user/models/user.model');
const PendingSignup = require('./modules/auth/models/pending-signup.model');
const bcrypt = require('bcryptjs');

// Mock email to avoid network IP restrictions during test
const emailModule = require('./utils/email');
emailModule.sendOtpEmail = async (email, code, purpose) => {
  console.log(`[MOCK] Sent OTP ${code} to ${email} for ${purpose}`);
  return true;
};

async function runTests() {
  console.log('Connecting to DB...');
  await sequelize.authenticate();
  
  // We'll use a random email so tests don't collide
  const testEmail = `test_${Date.now()}@example.com`;
  
  console.log(`\n--- Starting OTP Tests for ${testEmail} ---`);
  
  try {
    // 1. Initiate Signup
    console.log('\n1. Test: Signup (Multiple Requests & Correct OTP)');
    await signup({
      fullName: 'Test User',
      username: `testuser_${Date.now()}`,
      email: testEmail,
      phone: '1234567890'
    });
    console.log('Signup initiated successfully. Email sent.');
    
    // Check DB for OTP and verify it's hashed
    let otpRecord = await Otp.findOne({ where: { email: testEmail } });
    console.log(`Stored OTP record exists: ${!!otpRecord}`);
    console.log(`Is codeHash a bcrypt hash? ${otpRecord.codeHash.startsWith('$2a$') || otpRecord.codeHash.startsWith('$2b$')}`);
    
    // Test: Multiple OTP Requests (Cooldown)
    try {
      await resendOtp(testEmail);
      console.log('❌ Failed: Should have thrown cooldown error');
    } catch (e) {
      if (e.statusCode === 429) {
        console.log('✅ Passed: Prevented multiple OTP requests within cooldown window');
      } else {
        console.log('❌ Failed: Unexpected error on resend: ', e.message);
      }
    }
    
    // Since we don't know the generated plaintext OTP, we must update the DB hash manually for testing verification
    const knownCode = '123456';
    const knownHash = await bcrypt.hash(knownCode, 10);
    await otpRecord.update({ codeHash: knownHash });
    
    // Test: Incorrect OTP
    console.log('\n2. Test: Incorrect OTP');
    try {
      await verifyOtp(testEmail, '999999');
      console.log('❌ Failed: Should have rejected incorrect OTP');
    } catch (e) {
      console.log('✅ Passed: Rejected incorrect OTP');
    }
    
    // Test: Max Attempts
    console.log('\n3. Test: Maximum Attempts');
    // Make 4 more incorrect attempts (MAX_ATTEMPTS is 5)
    for (let i = 0; i < 4; i++) {
      try { await verifyOtp(testEmail, '999999'); } catch (e) {}
    }
    try {
      await verifyOtp(testEmail, '999999');
      console.log('❌ Failed: Should have thrown max attempts error');
    } catch (e) {
      if (e.statusCode === 429) {
        console.log('✅ Passed: Enforced maximum attempts limit');
      } else {
        console.log('❌ Failed: Unexpected error type for max attempts: ', e.message);
      }
    }
    
    // Create a new OTP record for testing Expired and Reused (since previous is locked out)
    await Otp.destroy({ where: { email: testEmail } });
    const freshCode = '111111';
    const freshHash = await bcrypt.hash(freshCode, 10);
    await Otp.create({
      email: testEmail,
      codeHash: freshHash,
      purpose: 'signup',
      expiresAt: new Date(Date.now() - 1000) // EXPIRED
    });
    
    // Test: Expired OTP
    console.log('\n4. Test: Expired OTP');
    try {
      await verifyOtp(testEmail, freshCode);
      console.log('❌ Failed: Should have rejected expired OTP');
    } catch (e) {
      if (e.message.includes('expired')) {
        console.log('✅ Passed: Rejected expired OTP');
      } else {
        console.log('❌ Failed: Unexpected error message for expired OTP: ', e.message);
      }
    }
    
    // Test: Correct OTP & Successful Signup
    console.log('\n5. Test: Correct OTP (Successful Flow)');
    await Otp.destroy({ where: { email: testEmail } });
    const finalCode = '555555';
    const finalHash = await bcrypt.hash(finalCode, 10);
    await Otp.create({
      email: testEmail,
      codeHash: finalHash,
      purpose: 'signup',
      expiresAt: new Date(Date.now() + 300000)
    });
    
    const verifyResponse = await verifyOtp(testEmail, finalCode);
    console.log('✅ Passed: Verified correct OTP successfully');
    console.log(`User created: ${!!verifyResponse.user.id}`);
    
    // Test: Reused OTP (consumed)
    console.log('\n6. Test: Reused OTP');
    try {
      // It was consumed in the previous step, so it should not find an active OTP
      await verifyOtp(testEmail, finalCode);
      console.log('❌ Failed: Should have rejected reused (consumed) OTP');
    } catch (e) {
      console.log('✅ Passed: Rejected consumed OTP');
    }
    
    console.log('\n--- All Tests Completed Successfully ---');
    
  } catch (err) {
    console.error('\nTest Execution Failed:', err);
  } finally {
    // Cleanup
    await User.destroy({ where: { email: testEmail } }).catch(()=>{});
    await PendingSignup.destroy({ where: { email: testEmail } }).catch(()=>{});
    await Otp.destroy({ where: { email: testEmail } }).catch(()=>{});
    process.exit(0);
  }
}

runTests();
