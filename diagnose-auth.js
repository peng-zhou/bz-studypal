#!/usr/bin/env node

/**
 * 诊断脚本 - 检查前端认证状态和 localStorage 数据
 * 
 * 运行方式：
 * 1. 在浏览器控制台中运行这段代码
 * 2. 或者打开浏览器开发工具，在 Application/存储 tab 中检查 localStorage
 */

console.log('=== 认证状态诊断 ===');

// 检查 localStorage 中的认证相关数据
console.log('\n1. 检查 localStorage:');
const accessToken = localStorage.getItem('accessToken');
const userStr = localStorage.getItem('user');
const authStorage = localStorage.getItem('auth-storage');

console.log('accessToken:', accessToken);
console.log('user:', userStr);
console.log('auth-storage:', authStorage);

if (accessToken) {
  console.log('✓ 找到访问令牌');
  if (accessToken === 'test-access-token') {
    console.log('⚠️  使用的是测试令牌');
  }
} else {
  console.log('❌ 没有找到访问令牌');
}

if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log('✓ 找到用户信息:', user);
  } catch (e) {
    console.log('❌ 用户信息格式错误:', e.message);
  }
} else {
  console.log('❌ 没有找到用户信息');
}

// 检查 Zustand 存储状态（如果在 React 应用中）
if (typeof window !== 'undefined' && window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
  console.log('\n2. React DevTools 可用，可以检查 Zustand store 状态');
}

// 建议的修复步骤
console.log('\n=== 建议的修复步骤 ===');

if (!accessToken && !userStr) {
  console.log('1. 看起来还没有登录，请先登录');
  console.log('2. 访问 http://localhost:3000/auth/login 进行登录');
} else if (accessToken && !userStr) {
  console.log('1. 有令牌但没有用户信息，可能需要重新获取用户资料');
  console.log('2. 尝试调用 checkAuth() 方法');
} else if (!accessToken && userStr) {
  console.log('1. 有用户信息但没有令牌，认证状态不一致');
  console.log('2. 建议清除所有数据重新登录');
  console.log('   localStorage.clear(); 然后重新登录');
} else {
  console.log('1. 令牌和用户信息都存在');
  console.log('2. 检查令牌是否有效，可能需要验证后端连接');
}

// 提供清除认证数据的函数
window.clearAuthData = function() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('user');
  localStorage.removeItem('auth-storage');
  console.log('✓ 已清除所有认证数据');
  console.log('请刷新页面并重新登录');
};

console.log('\n=== 工具函数 ===');
console.log('如需清除认证数据，请运行: clearAuthData()');

// 检查网络连接到后端
console.log('\n3. 检查后端连接:');
fetch('http://localhost:8000/api/health')
  .then(response => response.json())
  .then(data => {
    console.log('✓ 后端连接正常:', data);
  })
  .catch(error => {
    console.log('❌ 后端连接失败:', error.message);
    console.log('请确保后端服务正在运行在 http://localhost:8000');
  });

// 如果有令牌，测试认证接口
if (accessToken && accessToken !== 'test-access-token') {
  console.log('\n4. 测试认证接口:');
  fetch('http://localhost:8000/api/auth/profile', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  })
  .then(data => {
    console.log('✓ 认证接口测试成功:', data);
  })
  .catch(error => {
    console.log('❌ 认证接口测试失败:', error.message);
    console.log('令牌可能已过期，建议重新登录');
  });
}
