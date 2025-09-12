#!/bin/bash

# BZ StudyPal 认证API测试脚本

echo "🧪 BZ StudyPal 认证API测试"
echo "=========================="

# API基础URL
API_BASE="http://localhost:8000"
AUTH_BASE="$API_BASE/api/auth"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试结果计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 临时文件存储响应和cookies
RESPONSE_FILE="/tmp/bz_studypal_response.json"
COOKIE_JAR="/tmp/bz_studypal_cookies.txt"

# 测试函数
test_api() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    local description="$6"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    echo ""
    echo -e "${BLUE}测试 $TOTAL_TESTS: $test_name${NC}"
    echo "描述: $description"
    echo "请求: $method $endpoint"
    
    if [ -n "$data" ]; then
        echo "数据: $data"
    fi
    
    # 执行请求
    if [ "$method" = "GET" ]; then
        response_code=$(curl -s -w "%{http_code}" \
            -b "$COOKIE_JAR" \
            -c "$COOKIE_JAR" \
            -o "$RESPONSE_FILE" \
            "$AUTH_BASE$endpoint")
    elif [ "$method" = "POST" ]; then
        if [ -n "$data" ]; then
            response_code=$(curl -s -w "%{http_code}" \
                -X POST \
                -H "Content-Type: application/json" \
                -b "$COOKIE_JAR" \
                -c "$COOKIE_JAR" \
                -d "$data" \
                -o "$RESPONSE_FILE" \
                "$AUTH_BASE$endpoint")
        else
            response_code=$(curl -s -w "%{http_code}" \
                -X POST \
                -b "$COOKIE_JAR" \
                -c "$COOKIE_JAR" \
                -o "$RESPONSE_FILE" \
                "$AUTH_BASE$endpoint")
        fi
    fi
    
    # 检查响应状态码
    if [ "$response_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ 通过 - HTTP $response_code${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ 失败 - 期望 HTTP $expected_status, 实际 HTTP $response_code${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    # 显示响应内容
    if [ -f "$RESPONSE_FILE" ]; then
        echo "响应:"
        cat "$RESPONSE_FILE" | python3 -m json.tool 2>/dev/null || cat "$RESPONSE_FILE"
    fi
    
    echo "----------------------------------------"
}

# 清理函数
cleanup() {
    rm -f "$RESPONSE_FILE" "$COOKIE_JAR"
}

# 设置陷阱以确保清理
trap cleanup EXIT

# 开始测试

echo "🔍 检查服务器状态..."
if ! curl -s "$API_BASE/health" > /dev/null; then
    echo -e "${RED}❌ 服务器未运行，请先启动后端服务器${NC}"
    echo "运行命令: cd backend && npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ 服务器正在运行${NC}"

# 测试1: 检查认证状态
test_api "认证状态检查" "GET" "/status" "" "200" "检查认证系统配置状态"

# 测试2: Google OAuth配置
test_api "Google OAuth配置" "GET" "/google/config" "" "503" "获取Google OAuth配置（未配置时应返回503）"

# 测试3: 用户注册 - 无效数据
test_api "用户注册(无效数据)" "POST" "/register" '{"email":"invalid"}' "400" "使用无效邮箱注册应该失败"

# 测试4: 用户注册 - 有效数据
TEST_EMAIL="test$(date +%s)@example.com"
TEST_PASSWORD="password123"
TEST_NAME="Test User"
test_api "用户注册(有效数据)" "POST" "/register" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" "201" "使用有效数据注册新用户"

# 保存注册响应中的token
if [ -f "$RESPONSE_FILE" ]; then
    ACCESS_TOKEN=$(cat "$RESPONSE_FILE" | python3 -c "import json,sys;data=json.load(sys.stdin);print(data.get('data',{}).get('tokens',{}).get('accessToken',''))" 2>/dev/null)
fi

# 测试5: 重复注册
test_api "重复用户注册" "POST" "/register" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"name\":\"$TEST_NAME\"}" "409" "使用相同邮箱注册应该返回冲突"

# 测试6: 用户登录 - 错误密码
test_api "用户登录(错误密码)" "POST" "/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpassword\"}" "401" "使用错误密码登录应该失败"

# 测试7: 用户登录 - 正确凭证
test_api "用户登录(正确凭证)" "POST" "/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" "200" "使用正确凭证登录应该成功"

# 测试8: 获取用户信息 - 无token
cleanup_cookies() {
    rm -f "$COOKIE_JAR"
}
cleanup_cookies
test_api "获取用户信息(无认证)" "GET" "/profile" "" "401" "未认证状态下获取用户信息应该失败"

# 测试9: 重新登录获取token
test_api "重新登录获取token" "POST" "/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" "200" "重新登录获取认证token"

# 测试10: 获取用户信息 - 有token
test_api "获取用户信息(已认证)" "GET" "/profile" "" "200" "已认证状态下获取用户信息应该成功"

# 测试11: Token刷新
test_api "刷新Token" "POST" "/refresh" "" "200" "使用refresh token刷新访问令牌"

# 测试12: 用户登出
test_api "用户登出" "POST" "/logout" "" "200" "用户登出应该成功"

# 测试13: 登出后获取用户信息
test_api "登出后获取用户信息" "GET" "/profile" "" "401" "登出后获取用户信息应该失败"

# 测试14: Google OAuth (模拟)
test_api "Google OAuth(无token)" "POST" "/google" "{\"idToken\":\"invalid_token\"}" "500" "使用无效Google token应该失败"

# 测试总结
echo ""
echo "📊 测试总结"
echo "=========================="
echo -e "总测试数: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "通过测试: ${GREEN}$PASSED_TESTS${NC}"
echo -e "失败测试: ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n🎉 ${GREEN}所有测试通过！认证系统工作正常${NC}"
    exit 0
else
    echo -e "\n⚠️  ${YELLOW}有 $FAILED_TESTS 个测试失败，请检查API实现${NC}"
    exit 1
fi
