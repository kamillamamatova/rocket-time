//google OAuth login/callback
import { Router } from 'express';
import { google } from 'googleapis';
import { getOAuth2Client } from '../config/google.js';
import { query } from '../services/db.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Generate Google OAuth URL and redirect user
router.get('/login', (req, res) => {
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

    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    // Get user info from Google
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: userInfo } = await oauth2.userinfo.get();
    
    // Check if user exists in database
    let [users] = await query('SELECT * FROM users WHERE email = ?', [userInfo.email]);
    let user = users[0];
    
    if (!user) {
      // Create new user
      const userId = uuidv4();
      await query(
        'INSERT INTO users (id, first_name, last_name, email, google_id) VALUES (?, ?, ?, ?, ?)',
        [userId, userInfo.given_name || '', userInfo.family_name || '', userInfo.email, userInfo.id]
      );
      user = { id: userId, email: userInfo.email, first_name: userInfo.given_name, last_name: userInfo.family_name };
    }
    
    // Store OAuth credentials
    await query(
      `INSERT INTO oauth_credentials (user_id, access_token, refresh_token, token_expiry, scope) 
       VALUES (?, ?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       access_token = VALUES(access_token), 
       refresh_token = VALUES(refresh_token), 
       token_expiry = VALUES(token_expiry), 
       scope = VALUES(scope)`,
      [user.id, tokens.access_token, tokens.refresh_token, new Date(tokens.expiry_date), tokens.scope]
    );
    
    // Set session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    
    res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user info
router.get('/me', async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.json({ user: null });
    }
    
    const [users] = await query('SELECT id, first_name, last_name, email FROM users WHERE id = ?', [req.session.userId]);
    const user = users[0];
    
    if (!user) {
      req.session = null;
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
  req.session = null;
  res.json({ message: 'Logged out successfully' });
});

export default router;
