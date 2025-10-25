# Google OAuth Testing Guide

## Prerequisites Setup

### 1. Create Environment Variables File
First, create a `.env` file in your server directory:

```bash
# Create .env file in rocketTime/apps/server/
touch /Users/camilabarbosa/rocket-time/rocketTime/apps/server/.env
```

Add these environment variables to your `.env` file:
```env
# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_OAUTH_REDIRECT_URI=http://localhost:3000/api/auth/callback

# Google AI API Key
GOOGLE_API_KEY=your_google_ai_api_key_here

# Session Configuration
SESSION_SECRET=your_random_session_secret_here

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Database Configuration (if not already set)
DB_HOST=localhost
DB_USER=KHacks
DB_PASSWORD=hacking
DB_NAME=time
```

### 2. Set Up Google Cloud Console

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**
3. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Enable "Google+ API" (for user info)
   - Enable "Google Calendar API"
   - Enable "Generative AI API" (for chat functionality)

4. **Create OAuth 2.0 Credentials**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Name: "Rocket Time OAuth"
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback`
   - Copy the Client ID and Client Secret to your `.env` file

### 3. Run Database Migration
Execute the migration script to create the OAuth credentials table:

```sql
-- Run this in your MySQL database
USE `time`;

-- Add new columns to users table for OAuth
ALTER TABLE users 
ADD COLUMN email VARCHAR(255) UNIQUE,
ADD COLUMN google_id VARCHAR(255) UNIQUE,
ADD COLUMN created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Create OAuth credentials table
CREATE TABLE oauth_credentials (
  id INT NOT NULL AUTO_INCREMENT,
  user_id VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry DATETIME NOT NULL,
  scope TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY unique_user_oauth (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Add description column to goals table
ALTER TABLE goals 
ADD COLUMN description TEXT;

-- Add description column to timelogs table  
ALTER TABLE timelogs 
ADD COLUMN description TEXT;

-- Update the category enum to include 'exercise' (fixing the typo)
ALTER TABLE goals MODIFY COLUMN category ENUM('productive', 'learning', 'exercise', 'social', 'entertainment');
ALTER TABLE timelogs MODIFY COLUMN category ENUM('productive', 'learning', 'exercise', 'social', 'entertainment', 'time wasted');
```

## Testing Steps

### Step 1: Start Your Server
```bash
cd /Users/camilabarbosa/rocket-time/rocketTime/apps/server
npm run dev
```

### Step 2: Test OAuth Login Flow

#### Method 1: Browser Testing (Recommended)
1. **Open your browser** and go to: `http://localhost:3000/api/auth/login`
2. **You should be redirected** to Google's OAuth consent screen
3. **Sign in with your Google account**
4. **Grant permissions** for the requested scopes
5. **You should be redirected back** to your frontend URL (`http://localhost:5173`)

#### Method 2: Using curl/Postman
```bash
# Test login endpoint (will redirect to Google)
curl -i http://localhost:3000/api/auth/login

# Test callback endpoint (after getting auth code from Google)
curl -i "http://localhost:3000/api/auth/callback?code=AUTH_CODE_FROM_GOOGLE"
```

### Step 3: Test Authentication Status
After successful login, test if you're authenticated:

```bash
# Test /me endpoint
curl -i -b cookies.txt -c cookies.txt http://localhost:3000/api/auth/me
```

### Step 4: Test Protected Routes
Once authenticated, test protected endpoints:

```bash
# Test goals endpoint
curl -i -b cookies.txt http://localhost:3000/api/calendar/goals

# Test chat endpoint
curl -i -b cookies.txt -X POST \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, can you help me plan my day?"}' \
  http://localhost:3000/api/agent/chat
```

### Step 5: Test Logout
```bash
# Test logout
curl -i -b cookies.txt -X POST http://localhost:3000/api/auth/logout
```

## Troubleshooting Common Issues

### Issue 1: "Invalid redirect URI"
**Solution**: Make sure your redirect URI in Google Cloud Console exactly matches:
```
http://localhost:3000/api/auth/callback
```

### Issue 2: "Client ID not found"
**Solution**: 
- Check your `.env` file exists and has correct values
- Restart your server after adding environment variables
- Verify the Client ID in Google Cloud Console

### Issue 3: "Database connection error"
**Solution**:
- Make sure MySQL is running
- Check database credentials in your `.env` file
- Run the migration script to create required tables

### Issue 4: "Session not working"
**Solution**:
- Check that `SESSION_SECRET` is set in your `.env` file
- Make sure cookies are enabled in your browser
- Test with curl using `-b cookies.txt -c cookies.txt` flags

## Testing Checklist

- [ ] Environment variables are set correctly
- [ ] Google Cloud Console OAuth credentials are configured
- [ ] Database migration has been run
- [ ] Server starts without errors
- [ ] `/api/auth/login` redirects to Google
- [ ] OAuth callback creates user in database
- [ ] `/api/auth/me` returns user information
- [ ] Protected routes require authentication
- [ ] `/api/auth/logout` clears session
- [ ] Chat endpoint works with authenticated user

## Quick Test Script

Create a test script to verify everything works:

```bash
#!/bin/bash
# save as test_oauth.sh

echo "Testing OAuth flow..."

# Test server health
echo "1. Testing server health..."
curl -s http://localhost:3000/health | grep -q "ok" && echo "✅ Server is running" || echo "❌ Server not responding"

# Test login redirect
echo "2. Testing login redirect..."
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/login)
if [ "$response" = "302" ]; then
    echo "✅ Login redirect working"
else
    echo "❌ Login redirect failed (HTTP $response)"
fi

# Test unauthenticated /me
echo "3. Testing unauthenticated /me..."
response=$(curl -s http://localhost:3000/api/auth/me)
if echo "$response" | grep -q '"user":null'; then
    echo "✅ Unauthenticated /me returns null user"
else
    echo "❌ Unauthenticated /me should return null user"
fi

echo "Manual test: Visit http://localhost:3000/api/auth/login in your browser"
```

Run the test script:
```bash
chmod +x test_oauth.sh
./test_oauth.sh
```

## Expected Flow

1. **User visits** `/api/auth/login`
2. **Server redirects** to Google OAuth consent screen
3. **User grants permissions** and Google redirects back with auth code
4. **Server exchanges code** for access/refresh tokens
5. **Server creates/updates user** in database
6. **Server stores OAuth credentials** in database
7. **Server sets session** and redirects to frontend
8. **User is now authenticated** and can access protected routes

This should give you a complete testing setup for your Google OAuth implementation!
