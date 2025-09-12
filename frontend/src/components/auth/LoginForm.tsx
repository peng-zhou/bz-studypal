'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
} from '@mui/icons-material';
import { useAuth } from '../../stores/authStore';
import { LoginData } from '../../lib/api';

// 表单验证规则
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('请输入有效的邮箱地址')
    .required('邮箱不能为空'),
  password: yup
    .string()
    .min(6, '密码至少6位')
    .required('密码不能为空'),
});

interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginData>({
    resolver: yupResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginData) => {
    try {
      clearError();
      await login(data);
      
      // 登录成功
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      // 错误已经在store中处理
      console.error('Login error:', error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card 
      sx={{ 
        maxWidth: 400, 
        margin: '0 auto',
        boxShadow: 3,
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: 4 }}>
        {/* 标题 */}
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom>
            BZ StudyPal
          </Typography>
          <Typography variant="h5" component="h2" color="primary" gutterBottom>
            用户登录
          </Typography>
          <Typography variant="body2" color="text.secondary">
            请输入您的邮箱和密码
          </Typography>
        </Box>

        {/* 错误提示 */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            onClose={clearError}
          >
            {error}
          </Alert>
        )}

        {/* 登录表单 */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* 邮箱输入 */}
          <TextField
            {...register('email')}
            fullWidth
            label="邮箱地址"
            type="email"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {/* 密码输入 */}
          <TextField
            {...register('password')}
            fullWidth
            label="密码"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleTogglePasswordVisibility}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          {/* 登录按钮 */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ 
              mb: 2,
              height: 48,
              textTransform: 'none',
              fontSize: '1.1rem',
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              '登录'
            )}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              或
            </Typography>
          </Divider>

          {/* 注册链接 */}
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              还没有账号？{' '}
              <Link 
                href="/auth/register" 
                style={{ 
                  color: '#1976d2', 
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                立即注册
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
