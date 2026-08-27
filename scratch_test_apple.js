require('dotenv').config();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const appleSignin = require('apple-signin-auth');
const { verifyAppleToken } = require('./modules/auth/services/apple.service');

// Generate a fake RSA keypair to simulate Apple's keys
const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

const wrongPrivateKey = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
}).privateKey;

// Mock the environment
process.env.APPLE_CLIENT_ID = 'com.glunity.app';

// Mock the appleSignin.verifyIdToken to avoid hitting Apple's JWKS endpoint
// We will use standard jwt.verify to simulate exactly what apple-signin-auth does under the hood
const originalVerifyIdToken = appleSignin.verifyIdToken;
appleSignin.verifyIdToken = async (idToken, options) => {
  // Simulate fetching Apple's public key by just using our generated public key
  // We pass options (which will include audience, etc.) directly to jsonwebtoken
  return new Promise((resolve, reject) => {
    jwt.verify(idToken, publicKey, {
      algorithms: ['RS256'],
      audience: options.audience,
      ignoreExpiration: options.ignoreExpiration || false,
    }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
};

async function runTests() {
  console.log('--- Starting Apple Authentication Security Tests ---\n');

  // Helper to generate tokens
  const generateToken = (payload, secret, signOptions) => {
    return jwt.sign(payload, secret, { algorithm: 'RS256', ...signOptions });
  };

  const basePayload = {
    iss: 'https://appleid.apple.com',
    sub: 'apple_user_123',
    email: 'test@privaterelay.appleid.com'
  };

  // 1. Valid Token
  console.log('1. Testing Valid Apple Token...');
  const validToken = generateToken(basePayload, privateKey, {
    audience: 'com.glunity.app',
    expiresIn: '1h'
  });
  try {
    const result = await verifyAppleToken(validToken);
    console.log('✅ Passed: Accepted valid token', result);
  } catch (err) {
    console.log('❌ Failed:', err.message);
  }

  // 2. Expired Token
  console.log('\n2. Testing Expired Apple Token...');
  // Create a token that expired 1 hour ago
  const expiredToken = generateToken(basePayload, privateKey, {
    audience: 'com.glunity.app',
    expiresIn: '-1h' // expired
  });
  try {
    await verifyAppleToken(expiredToken);
    console.log('❌ Failed: Accepted expired token! (ignoreExpiration might still be true)');
  } catch (err) {
    if (err.message.includes('jwt expired') || err.message.includes('expired')) {
      console.log(`✅ Passed: Rejected expired token with error: "${err.message}" (Status: ${err.status})`);
    } else {
      console.log('❌ Failed: Unexpected error:', err.message);
    }
  }

  // 3. Invalid Signature
  console.log('\n3. Testing Invalid Signature...');
  const invalidSigToken = generateToken(basePayload, wrongPrivateKey, {
    audience: 'com.glunity.app',
    expiresIn: '1h'
  });
  try {
    await verifyAppleToken(invalidSigToken);
    console.log('❌ Failed: Accepted token with invalid signature');
  } catch (err) {
    if (err.message.includes('invalid signature')) {
      console.log(`✅ Passed: Rejected invalid signature with error: "${err.message}"`);
    } else {
      console.log('❌ Failed: Unexpected error:', err.message);
    }
  }

  // 4. Wrong Audience
  console.log('\n4. Testing Wrong Audience...');
  const wrongAudToken = generateToken(basePayload, privateKey, {
    audience: 'com.hacker.app', // Wrong audience
    expiresIn: '1h'
  });
  try {
    await verifyAppleToken(wrongAudToken);
    console.log('❌ Failed: Accepted token with wrong audience');
  } catch (err) {
    if (err.message.includes('jwt audience invalid') || err.message.includes('audience')) {
      console.log(`✅ Passed: Rejected wrong audience with error: "${err.message}"`);
    } else {
      console.log('❌ Failed: Unexpected error:', err.message);
    }
  }

  console.log('\n--- Tests Completed ---');
}

runTests();
