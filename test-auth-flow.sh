#!/bin/bash

echo "🧪 Testing BZ StudyPal Authentication Flow"
echo "=========================================="
echo

# Test health check
echo "1. 🏥 Health Check"
curl -s http://localhost:8000/health | jq '.'
echo

# Test auth status
echo "2. 📊 Auth Status"
curl -s http://localhost:8000/api/auth/status | jq '.data'
echo

# Test user registration
echo "3. 👤 Testing User Registration"
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"testuser$(date +%s)@test.com\",\"password\":\"TestPass123\",\"name\":\"Test User\",\"preferredLanguage\":\"zh\"}")

if echo "$REGISTER_RESPONSE" | jq -e '.success' > /dev/null; then
  echo "✅ Registration successful"
  ACCESS_TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.data.tokens.accessToken')
  echo "📋 Token obtained: ${ACCESS_TOKEN:0:20}..."
else
  echo "❌ Registration failed"
  echo "$REGISTER_RESPONSE" | jq '.'
fi
echo

# Test protected route
if [ ! -z "$ACCESS_TOKEN" ]; then
  echo "4. 🔒 Testing Protected Route (Profile)"
  curl -s -H "Authorization: Bearer $ACCESS_TOKEN" \
    http://localhost:8000/api/auth/profile | jq '.'
  echo
fi

echo "🎉 Authentication test complete!"
echo
echo "Frontend URL: http://localhost:3001"
echo "Backend URL:  http://localhost:8000"
echo
echo "Try these pages in your browser:"
echo "- Main page:    http://localhost:3001"
echo "- Login page:   http://localhost:3001/auth/login"
echo "- Register page: http://localhost:3001/auth/register"
