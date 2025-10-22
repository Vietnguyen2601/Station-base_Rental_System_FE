import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { LoginFormProps, LoginCredentials } from '../../../types';
import authService, { ApiError } from '../../../services/authService';
import './LoginForm.scss';

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSubmit, 
  onForgotPassword, 
  onRegister, 
  isLoading, 
  error 
}) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Username validation
    if (!credentials.username.trim()) {
      errors.username = 'Username là bắt buộc';
    } else if (credentials.username.length < 3) {
      errors.username = 'Username phải có ít nhất 3 ký tự';
    }

    // Password validation
    if (!credentials.password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (credentials.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await authService.login({
        username: credentials.username,
        password: credentials.password
      });

      // Save user data
      authService.saveCurrentUser(response.user);
      
      // Call parent onSubmit with user data
      onSubmit({
        ...credentials,
        user: response.user
      } as any);
      
    } catch (error) {
      console.error('Login error:', error);
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        setSubmitError((error as ApiError).message);
      } else {
        setSubmitError('Đăng nhập thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-form">
      <div className="login-form__header">
        <h2 className="login-form__title">Đăng Nhập</h2>
        <p className="login-form__subtitle">
          Chào mừng bạn quay trở lại với EVRental
        </p>
      </div>

      <form onSubmit={handleSubmit} className="login-form__form">
        {/* Global Error Message */}
        {(error || submitError) && (
          <div className="login-form__error-banner">
            <AlertCircle size={20} />
            <span>{error || submitError}</span>
          </div>
        )}

        {/* Username Field */}
        <div className="login-form__field">
          <label htmlFor="username" className="login-form__label">
            Username *
          </label>
          <div className="login-form__input-wrapper">
            <User className="login-form__input-icon" />
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              className={`login-form__input ${validationErrors.username ? 'login-form__input--error' : ''}`}
              placeholder="Nhập username của bạn"
            />
          </div>
          {validationErrors.username && (
            <span className="login-form__error">{validationErrors.username}</span>
          )}
        </div>

        {/* Password Field */}
        <div className="login-form__field">
          <label htmlFor="password" className="login-form__label">
            Mật khẩu *
          </label>
          <div className="login-form__input-wrapper">
            <Lock className="login-form__input-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              className={`login-form__input ${validationErrors.password ? 'login-form__input--error' : ''}`}
              placeholder="Nhập mật khẩu của bạn"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="login-form__password-toggle"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {validationErrors.password && (
            <span className="login-form__error">{validationErrors.password}</span>
          )}
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="login-form__options">
          <label className="login-form__checkbox-label">
            <input
              type="checkbox"
              name="rememberMe"
              checked={credentials.rememberMe}
              onChange={handleInputChange}
              className="login-form__checkbox"
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="login-form__link-btn"
          >
            Quên mật khẩu?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || isSubmitting}
          className="login-form__submit-btn btn btn-primary"
        >
          {(isLoading || isSubmitting) ? 'Đang đăng nhập...' : 'Đăng Nhập'}
        </button>

        {/* Register Link */}
        <div className="login-form__register-link">
          <p>
            Chưa có tài khoản?{' '}
            <button
              type="button"
              onClick={onRegister}
              className="login-form__link-btn"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};

export default LoginForm;