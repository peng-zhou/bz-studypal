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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Language,
} from '@mui/icons-material';
import { useAuth } from '../../stores/authStore';
import { RegisterData } from '../../lib/api';

// 表单验证规则
const registerSchema = yup.object().shape({
  name: yup
    .string()
    .min(2, '姓名至少2个字符')
    .max(50, '姓名不能超过50个字符')
    .required('姓名不能为空'),
  email: yup
    .string()
    .email('请输入有效的邮箱地址')
    .required('邮箱不能为空'),
  password: yup
    .string()
    .min(8, '密码至少8位')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码必须包含大小写字母和数字')
    .required('密码不能为空'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], '确认密码不匹配')
    .required('请确认密码'),
  preferredLanguage: yup
    .string()
    .oneOf(['zh', 'en'], '请选择有效的语言')
    .required('请选择首选语言'),
});

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
}

interface RegisterFormProps {
  onSuccess?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const { register: registerUser, isLoading, error, clearError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      preferredLanguage: 'zh',
    },
  });

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      
      // 移除confirmPassword字段
      const { confirmPassword, ...registerData } = data;
      
      await registerUser(registerData);
      
      // 注册成功
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      // 错误已经在store中处理
      console.error('Register error:', error);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
            用户注册
          </Typography>
          <Typography variant="body2" color="text.secondary">
            创建您的学习账号
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

        {/* 注册表单 */}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* 姓名输入 */}
          <TextField
            {...register('name')}
            fullWidth
            label="姓名"
            autoComplete="name"
            error={!!errors.name}
            helperText={errors.name?.message}
            disabled={isLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Person color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

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

          {/* 首选语言选择 */}
          <FormControl fullWidth sx={{ mb: 2 }} error={!!errors.preferredLanguage}>
            <InputLabel id="language-select-label">首选语言</InputLabel>
            <Select
              {...register('preferredLanguage')}
              labelId="language-select-label"
              label="首选语言"
              disabled={isLoading}
              startAdornment={
                <InputAdornment position="start">
                  <Language color="action" />
                </InputAdornment>
              }
            >
              <MenuItem value="zh">中文</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
            {errors.preferredLanguage && (
              <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                {errors.preferredLanguage.message}
              </Typography>
            )}
          </FormControl>

          {/* 密码输入 */}
          <TextField
            {...register('password')}
            fullWidth
            label="密码"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={!!errors.password}
            helperText={errors.password?.message || '至少8位，包含大小写字母和数字'}
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
            sx={{ mb: 2 }}
          />

          {/* 确认密码输入 */}
          <TextField
            {...register('confirmPassword')}
            fullWidth
            label="确认密码"
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
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
                    onClick={handleToggleConfirmPasswordVisibility}
                    edge="end"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          {/* 注册按钮 */}
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
              '注册账号'
            )}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="body2" color="text.secondary">
              或
            </Typography>
          </Divider>

          {/* 登录链接 */}
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              已有账号？{' '}
              <Link 
                href="/auth/login" 
                style={{ 
                  color: '#1976d2', 
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                立即登录
              </Link>
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
