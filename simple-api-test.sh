#!/bin/bash

# 简化的API测试脚本
BASE_URL="http://localhost:8000"

echo "🧪 Testing BZ StudyPal Authentication API"
echo "=========================================="

# 测试函数
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=${4:-""}
    local description=$5
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "%{http_code}" -m 5 "${BASE_URL}${endpoint}")
    else
        response=$(curl -s -w "%{http_code}" -X "$method" -m 5 \
            -H "Content-Type: application/json" \
            -d "$data" "${BASE_URL}${endpoint}")
    fi
    
    if [ $? -eq 0 ]; then
        status_code="${response: -3}"
        body="${response%???}"
        
        if [ "$status_code" = "$expected_status" ]; then
            echo "✅ PASS ($status_code)"
            return 0
        else
            echo "❌ FAIL (Expected: $expected_status, Got: $status_code)"
            echo "   Response: $body" | head -c 100
            return 1
        fi
    else
        echo "❌ FAIL (Connection error)"
        return 1
    fi
}

# 运行测试
passed=0
total=0

# 基础测试
((total++))
test_endpoint "GET" "/" "200" "" "Root endpoint" && ((passed++))

((total++))
test_endpoint "GET" "/health" "200" "" "Health check" && ((passed++))

((total++))
test_endpoint "GET" "/api/auth/status" "200" "" "Auth status" && ((passed++))

# 注册测试
((total++))
test_endpoint "POST" "/api/auth/register" "201" '{"email":"test@example.com","password":"password123","name":"Test User"}' "User registration" && ((passed++))

echo ""
echo "=========================================="
echo "Test Results: $passed/$total passed"
if [ $passed -eq $total ]; then
    echo "🎉 All tests passed!"
    exit 0
else
    echo "❌ Some tests failed"
    exit 1
fi
