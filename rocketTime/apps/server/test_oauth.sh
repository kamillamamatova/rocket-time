#!/bin/bash

# OAuth Testing Script for Rocket Time
# Run this script to test your OAuth implementation

echo "🚀 Rocket Time OAuth Testing Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if server is running
echo "1. Checking if server is running..."
server_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health 2>/dev/null)
if [ "$server_response" = "200" ]; then
    print_status 0 "Server is running on port 3000"
else
    print_status 1 "Server is not running. Please start it with: npm run dev"
    exit 1
fi

# Check if .env file exists
echo "2. Checking environment configuration..."
if [ -f ".env" ]; then
    print_status 0 ".env file exists"
    
    # Check for required environment variables
    if grep -q "GOOGLE_CLIENT_ID" .env && grep -q "GOOGLE_CLIENT_SECRET" .env; then
        print_status 0 "Google OAuth credentials found in .env"
    else
        print_status 1 "Missing Google OAuth credentials in .env"
        print_warning "Make sure to add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file"
    fi
else
    print_status 1 ".env file not found"
    print_warning "Create a .env file with your Google OAuth credentials"
fi

# Test database connection
echo "3. Testing database connection..."
db_response=$(curl -s http://localhost:3000/db-test 2>/dev/null)
if echo "$db_response" | grep -q "DB Connected"; then
    print_status 0 "Database connection working"
else
    print_status 1 "Database connection failed"
    print_warning "Make sure MySQL is running and credentials are correct"
fi

# Test OAuth login endpoint
echo "4. Testing OAuth login endpoint..."
login_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/auth/login 2>/dev/null)
if [ "$login_response" = "302" ]; then
    print_status 0 "OAuth login endpoint redirects correctly"
else
    print_status 1 "OAuth login endpoint failed (HTTP $login_response)"
fi

# Test unauthenticated /me endpoint
echo "5. Testing unauthenticated /me endpoint..."
me_response=$(curl -s http://localhost:3000/api/auth/me 2>/dev/null)
if echo "$me_response" | grep -q '"user":null'; then
    print_status 0 "Unauthenticated /me returns null user"
else
    print_status 1 "Unauthenticated /me should return null user"
fi

# Test protected routes without authentication
echo "6. Testing protected routes without authentication..."
goals_response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/calendar/goals 2>/dev/null)
if [ "$goals_response" = "401" ]; then
    print_status 0 "Protected routes require authentication"
else
    print_status 1 "Protected routes should return 401 without authentication"
fi

echo ""
echo "🎯 Manual Testing Steps:"
echo "========================"
echo "1. Open your browser and go to: http://localhost:3000/api/auth/login"
echo "2. Complete the Google OAuth flow"
echo "3. You should be redirected to your frontend"
echo "4. Test authenticated endpoints:"
echo "   - GET http://localhost:3000/api/auth/me"
echo "   - GET http://localhost:3000/api/calendar/goals"
echo "   - POST http://localhost:3000/api/agent/chat"
echo ""
echo "📋 Troubleshooting:"
echo "==================="
echo "• If OAuth fails: Check Google Cloud Console settings"
echo "• If database fails: Run the migration script"
echo "• If server won't start: Check .env file and dependencies"
echo ""
echo "📚 For detailed instructions, see: OAUTH_TESTING_GUIDE.md"
