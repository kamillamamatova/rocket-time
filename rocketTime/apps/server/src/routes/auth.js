//google OAuth login/callback
import { Router } from 'express';
import { google } from 'googleapis';
import { getOAuth2Client } from '../config/google.js';
import { query } from '../services/db.js';

const router = Router();

// Generate Google OAuth URL and redirect user
router.get('/login', (req, res) => {
  // Initialize session to track OAuth flow
  if (!req.session) {
    req.session = {};
  }
  req.session.oauthState = 'pending';
  
  console.log('Login initiated - Session initialized');
  
  const oauth2Client = getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/calendar'
  ];
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent'
  });
  
  res.redirect(authUrl);
});

// Handle OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code not provided' });
    }
    console.log("Here")
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    console.log("One - Got tokens")
    
    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    console.log("Two - Got user info from Google:", userInfo.email)
    
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
      console.log("Three - Created new user with ID:", userId)
      user = { id: userId, email: userInfo.email, first_name: userInfo.given_name, last_name: userInfo.family_name };
    } else {
      console.log("Three - Found existing user with ID:", user.id)
    }
    
    // Store OAuth credentials - user_id should be the integer id as string
    await query(
      `INSERT INTO oauth_credentials (user_id, access_token, refresh_token, token_expiry, scope) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       access_token = VALUES(access_token), 
       refresh_token = VALUES(refresh_token), 
       token_expiry = VALUES(token_expiry), 
       scope = VALUES(scope)`,
      [String(user.id), tokens.access_token, tokens.refresh_token, new Date(tokens.expiry_date), tokens.scope]
    );
    console.log('Four - Stored OAuth credentials')
    
    // Ensure session exists
    if (!req.session) {
      req.session = {};
    }
    
    // Set session with user data
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.oauthState = 'completed';
    
    console.log('Five - Session set for user:', user.email, 'UserId:', user.id);
    
    res.redirect((process.env.FRONTEND_URL || 'http://localhost:3000') + '/');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    console.log('Session data:', req.session);
    
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

// Logout
router.post('/logout', (req, res) => {
  if (req.session) {
    req.session = null;
  }
  res.clearCookie('sid');
  res.json({ message: 'Logged out successfully' });
});

export default router;
