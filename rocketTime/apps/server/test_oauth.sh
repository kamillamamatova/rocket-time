#!/bin/bash

# OAuth Testing Script for Rocket Time
# Usage: BASE_URL=http://localhost:3001 ./test_oauth.sh

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3001}"

echo "Rocket Time OAuth Testing Script"
echo "================================="
echo "Using BASE_URL=$BASE_URL"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
  if [ "$1" -eq 0 ]; then
    echo -e "${GREEN}OK $2${NC}"
  else
    echo -e "${RED}FAIL $2${NC}"
  fi
}

print_warning() {
  echo -e "${YELLOW}WARN $1${NC}"
}

echo "1) Checking server health..."
server_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null || true)
if [ "$server_response" = "200" ]; then
  print_status 0 "Server is healthy"
else
  print_status 1 "Server not reachable at $BASE_URL"
  exit 1
fi

echo "2) Checking .env presence..."
if [ -f ".env" ]; then
  print_status 0 ".env exists"
  if grep -q "GOOGLE_CLIENT_ID" .env && grep -q "GOOGLE_CLIENT_SECRET" .env && grep -q "GOOGLE_OAUTH_REDIRECT_URI" .env; then
    print_status 0 "OAuth env keys exist"
  else
    print_status 1 "Missing required OAuth env keys"
  fi
else
  print_status 1 ".env not found"
  print_warning "Create .env from .env.example"
fi

echo "3) Testing database connection..."
db_response=$(curl -s "$BASE_URL/db-test" 2>/dev/null || true)
if echo "$db_response" | grep -q "DB Connected"; then
  print_status 0 "Database connection OK"
else
  print_status 1 "Database connection failed"
  print_warning "Verify MYSQL_* variables and DB availability"
fi

echo "4) Testing OAuth login redirect..."
login_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login" 2>/dev/null || true)
if [ "$login_response" = "302" ]; then
  print_status 0 "OAuth login endpoint redirects"
else
  print_status 1 "OAuth login endpoint failed (HTTP $login_response)"
fi

echo "5) Testing unauthenticated /auth/me..."
me_response=$(curl -s "$BASE_URL/auth/me" 2>/dev/null || true)
if echo "$me_response" | grep -q '"user":null'; then
  print_status 0 "Unauthenticated /auth/me returns null user"
else
  print_status 1 "Unexpected /auth/me response without auth"
fi

echo "6) Testing protected route guard..."
goals_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/calendar/goals" 2>/dev/null || true)
if [ "$goals_response" = "401" ]; then
  print_status 0 "Protected routes require authentication"
else
  print_status 1 "Expected 401 for unauthenticated /calendar/goals"
fi

echo
echo "Manual steps"
echo "1. Open: $BASE_URL/auth/login"
echo "2. Complete Google OAuth"
echo "3. Validate authenticated endpoints:"
echo "   - GET $BASE_URL/auth/me"
echo "   - GET $BASE_URL/calendar/goals"
echo "   - POST $BASE_URL/agent/chat"
echo
echo "For detailed instructions, see OAUTH_TESTING_GUIDE.md"
