const { OAuth2Client } = require('google-auth-library');

// Intentionally lazily instantiate so it doesn't crash on startup if missing
let client;
const getClient = () => {
  if (!client) {
    client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }
  return client;
};

/**
 * Verifies a Google ID token.
 * @param {string} idToken - The JWT received from Google Sign-In on the client.
 * @returns {Promise<{ providerUserId: string, email: string, fullName: string }>}
 */
const verifyGoogleToken = async (idToken) => {
  try {
    const ticket = await getClient().verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid Google token payload');
    }
    
    return {
      providerUserId: payload.sub,
      email: payload.email,
      fullName: payload.name || 'Google User', // fallback if name is not provided
    };
  } catch (error) {
    const err = new Error('Google authentication failed: ' + error.message);
    err.status = 401;
    throw err;
  }
};

module.exports = {
  verifyGoogleToken,
};
