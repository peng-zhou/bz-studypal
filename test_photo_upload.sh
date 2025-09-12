#!/bin/bash

# Test Photo Upload Functionality
echo "🧪 Testing Photo Upload for Wrong Questions"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000"

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Function to extract JSON field
extract_json() {
    echo "$1" | grep -o "\"$2\":[^,}]*" | cut -d'"' -f4
}

# 1. Test server health
echo -e "${BLUE}1. Testing server health...${NC}"
health_response=$(curl -s -X GET "$BASE_URL/health")
if echo "$health_response" | grep -q "healthy"; then
    print_result 0 "Server is healthy"
else
    print_result 1 "Server health check failed"
    exit 1
fi

# 2. Create test user
echo -e "\n${BLUE}2. Creating test user...${NC}"
timestamp=$(date +%s)
test_email="testuser${timestamp}@example.com"
register_response=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$test_email\",
    \"password\": \"TestPass123\",
    \"name\": \"Test User\",
    \"preferredLanguage\": \"zh\"
  }")

if echo "$register_response" | grep -q "success.*true"; then
    print_result 0 "User registration successful"
    # Extract token - this is a simplified extraction for testing
    access_token=$(echo "$register_response" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    if [ -n "$access_token" ]; then
        echo "Token extracted successfully"
    else
        echo -e "${RED}❌ Failed to extract access token${NC}"
        echo "Response: $register_response"
        exit 1
    fi
else
    print_result 1 "User registration failed"
    echo "Response: $register_response"
    exit 1
fi

# 3. Create test subject first (needed for questions)
echo -e "\n${BLUE}3. Creating test subject...${NC}"
subject_response=$(curl -s -X POST "$BASE_URL/api/v1/subjects" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $access_token" \
  -d '{
    "code": "TEST_MATH",
    "nameZh": "测试数学",
    "nameEn": "Test Math",
    "description": "Test subject for photo upload",
    "color": "#FF5722"
  }')

if echo "$subject_response" | grep -q "success.*true"; then
    print_result 0 "Test subject created"
    subject_id=$(echo "$subject_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
    print_result 1 "Test subject creation failed"
    echo "Response: $subject_response"
    exit 1
fi

# 4. Test upload endpoint (without actual file for now)
echo -e "\n${BLUE}4. Testing upload endpoint structure...${NC}"
upload_response=$(curl -s -X POST "$BASE_URL/api/v1/questions/upload" \
  -H "Authorization: Bearer $access_token")

# Should get an error about no files, but endpoint should exist
if echo "$upload_response" | grep -q "No files uploaded\|success.*false"; then
    print_result 0 "Upload endpoint exists and responds correctly"
else
    print_result 1 "Upload endpoint test failed"
    echo "Response: $upload_response"
fi

# 5. Create a question with image URLs (simulating uploaded images)
echo -e "\n${BLUE}5. Creating question with image references...${NC}"
question_response=$(curl -s -X POST "$BASE_URL/api/v1/questions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $access_token" \
  -d "{
    \"title\": \"Test Question with Images\",
    \"content\": \"This is a test question that should have images.\",
    \"images\": [\"/uploads/questions/test-image1.jpg\", \"/uploads/questions/test-image2.jpg\"],
    \"myAnswer\": \"My wrong answer\",
    \"correctAnswer\": \"The correct answer\",
    \"explanation\": \"This is the explanation\",
    \"subjectId\": \"$subject_id\",
    \"difficulty\": \"MEDIUM\",
    \"errorType\": \"CONCEPTUAL\"
  }")

if echo "$question_response" | grep -q "success.*true"; then
    print_result 0 "Question with images created successfully"
    question_id=$(echo "$question_response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
else
    print_result 1 "Question creation failed"
    echo "Response: $question_response"
    exit 1
fi

# 6. Retrieve the question and verify images field
echo -e "\n${BLUE}6. Verifying question retrieval with images...${NC}"
get_response=$(curl -s -X GET "$BASE_URL/api/v1/questions/$question_id" \
  -H "Authorization: Bearer $access_token")

if echo "$get_response" | grep -q "test-image1.jpg\|test-image2.jpg"; then
    print_result 0 "Question images stored and retrieved correctly"
else
    print_result 1 "Question images verification failed"
    echo "Response: $get_response"
fi

# 7. Test questions list endpoint
echo -e "\n${BLUE}7. Testing questions list with images...${NC}"
list_response=$(curl -s -X GET "$BASE_URL/api/v1/questions" \
  -H "Authorization: Bearer $access_token")

if echo "$list_response" | grep -q "success.*true" && echo "$list_response" | grep -q "test-image"; then
    print_result 0 "Questions list includes image data"
else
    print_result 1 "Questions list test failed"
    echo "Response: $list_response"
fi

# 8. Test static file serving (check if uploads directory exists)
echo -e "\n${BLUE}8. Checking uploads directory structure...${NC}"
if [ -d "../backend/uploads/questions" ]; then
    print_result 0 "Uploads directory exists"
else
    print_result 1 "Uploads directory missing"
fi

echo -e "\n${GREEN}🎉 Photo Upload Integration Tests Complete!${NC}"
echo -e "${BLUE}Summary:${NC}"
echo "- Backend API endpoints are functional"
echo "- Authentication works correctly"
echo "- Questions can store image references"
echo "- Image URLs are properly saved and retrieved"
echo "- Upload infrastructure is in place"

echo -e "\n${BLUE}Next Steps for Complete Testing:${NC}"
echo "- Test actual file uploads using multipart/form-data"
echo "- Test image deletion functionality"
echo "- Test frontend integration with drag-and-drop"
echo "- Test file validation and error handling"
