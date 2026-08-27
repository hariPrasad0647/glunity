const appleSignin = require('apple-signin-auth');

/**
 * Verifies an Apple identity token.
 * @param {string} identityToken - The JWT received from Sign in with Apple on the client.
 * @returns {Promise<{ providerUserId: string, email: string }>}
 */
const verifyAppleToken = async (identityToken) => {
  try {
    const payload = await appleSignin.verifyIdToken(identityToken, {
      audience: process.env.APPLE_CLIENT_ID,
    });
    
    if (!payload) {
      throw new Error('Invalid Apple token payload');
    }
    
    return {
      providerUserId: payload.sub,
      email: payload.email,
    };
  } catch (error) {
    const err = new Error('Apple authentication failed: ' + error.message);
    err.status = 401;
    throw err;
  }
};

module.exports = {
  verifyAppleToken,
};
