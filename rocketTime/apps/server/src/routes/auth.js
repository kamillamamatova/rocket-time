//google OAuth login/callback
import { Router } from 'express';
import { randomBytes } from 'crypto';
import { google } from 'googleapis';
import { getOAuth2Client } from '../config/google.js';
import { query } from '../services/db.js';
import { encryptToken } from '../services/tokenCrypto.js';

const router = Router();
const normalizeOrigin = (value) => value?.trim().replace(/\/+$/, '');
const allowedFrontendOrigins = [
  ...new Set(
    (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || '')
      .split(',')
      .map(normalizeOrigin)
      .filter(Boolean)
  ),
];
const applyNoStore = (res) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
  });
};

const resolveFrontendOrigin = (value) => {
  const normalized = normalizeOrigin(value);
  if (!normalized) {
    return null;
  }

  return allowedFrontendOrigins.includes(normalized) ? normalized : null;
};

const clearSessionCookie = (req, res) => {
  if (req.session) {
    req.session = null;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const cookieSameSite = process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax');

  res.clearCookie('sid', {
    httpOnly: true,
    secure: isProduction,
    sameSite: cookieSameSite,
    path: '/',
  });
};

// Generate Google OAuth URL and redirect user
router.get('/login', (req, res) => {
  // Initialize session to track OAuth flow
  if (!req.session) {
    req.session = {};
  }
  const oauthState = randomBytes(32).toString('hex');
  req.session.oauthState = oauthState;
  req.session.postAuthRedirect = resolveFrontendOrigin(req.query.redirect);

  const oauth2Client = getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar'
  ];

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: oauthState,
  });

  res.redirect(authUrl);
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  const fallbackFrontend =
    resolveFrontendOrigin(process.env.FRONTEND_URL) || 'http://localhost:3000';

  try {
    const { code, state } = req.query;
    if (!code) {
      console.error('OAuth callback: no code provided');
      return res.redirect(`${fallbackFrontend}/?error=auth_failed`);
    }

    // Validate CSRF state
    const expectedState = req.session?.oauthState;
    if (!expectedState || !state || state !== expectedState) {
      console.error('OAuth callback: state mismatch', {
        hasExpected: !!expectedState,
        hasReturned: !!state,
        match: state === expectedState,
      });
      return res.redirect(`${fallbackFrontend}/?error=auth_failed`);
    }
    req.session.oauthState = null;

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    if (!tokens?.access_token) {
      throw new Error('Google token exchange did not return an access token');
    }

    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();

    // Check if user exists in database
    const existingUsers = await query('SELECT * FROM users WHERE email = ?', [userInfo.email]);
    let user = existingUsers[0];

    if (!user) {
      // Create new user - let id auto-increment
      const result = await query(
        'INSERT INTO users (first_name, last_name, email, google_id) VALUES (?, ?, ?, ?)',
        [userInfo.given_name || '', userInfo.family_name || '', userInfo.email, userInfo.id]
      );
      const userId = result.insertId;
      user = { id: userId, email: userInfo.email, first_name: userInfo.given_name, last_name: userInfo.family_name };
    }

    // Store OAuth credentials encrypted at rest (non-fatal — only needed for AI Calendar)
    try {
      const expiryDate =
        typeof tokens.expiry_date === 'number' && Number.isFinite(tokens.expiry_date)
          ? new Date(tokens.expiry_date)
          : null;

      await query(
        `INSERT INTO oauth_credentials (user_id, access_token, refresh_token, token_expiry, scope)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         access_token = VALUES(access_token),
         refresh_token = VALUES(refresh_token),
         token_expiry = VALUES(token_expiry),
         scope = VALUES(scope)`,
        [
          String(user.id),
          encryptToken(tokens.access_token),
          encryptToken(tokens.refresh_token ?? null),
          expiryDate,
          tokens.scope ?? null
        ]
      );
    } catch (tokenErr) {
      console.error('OAuth token storage failed (AI Calendar unavailable):', tokenErr.message);
    }

    // Ensure session exists
    if (!req.session) {
      req.session = {};
    }

    // Set session with user data
    req.session.userId = user.id;
    req.session.userEmail = user.email;

    const frontendUrl =
      resolveFrontendOrigin(req.session?.postAuthRedirect) ||
      resolveFrontendOrigin(process.env.FRONTEND_URL) ||
      'http://localhost:3000';
    if (req.session) {
      req.session.postAuthRedirect = null;
    }
    console.log('OAuth callback: login successful, userId:', user.id);
    res.redirect(`${frontendUrl}/`);
  } catch (error) {
    console.error('OAuth callback error:', error.message);
    res.redirect(`${fallbackFrontend}/?error=auth_failed`);
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    applyNoStore(res);
    if (!req.session || !req.session.userId) {
      return res.json({ user: null });
    }

    const users = await query('SELECT id, first_name, last_name, email FROM users WHERE id = ?', [req.session.userId]);
    const user = users[0];

    
    if (!user) {
      // User doesn't exist in database, clear session
      req.session.userId = null;
      req.session.userEmail = null;
      return res.json({ user: null });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Backward-compatible alias
router.get('/user', async (req, res) => {
  try {
    applyNoStore(res);
    if (!req.session || !req.session.userId) {
      return res.json({ user: null });
    }
    const users = await query('SELECT id, first_name, last_name, email FROM users WHERE id = ?', [req.session.userId]);
    const user = users[0] || null;
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  applyNoStore(res);
  clearSessionCookie(req, res);
  res.json({ message: 'Logged out successfully' });
});

router.get('/logout', (req, res) => {
  applyNoStore(res);
  const redirectTo =
    resolveFrontendOrigin(req.query.redirect) ||
    resolveFrontendOrigin(process.env.FRONTEND_URL);
  clearSessionCookie(req, res);

  if (redirectTo) {
    return res.redirect(`${redirectTo}/`);
  }

  res.json({ message: 'Logged out successfully' });
});

export default router;
