import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { LoginFormProps, LoginCredentials } from '../../../types';
import './LoginForm.scss';

const LoginForm: React.FC<LoginFormProps> = ({ 
  onSubmit, 
  onForgotPassword, 
  onRegister, 
  isLoading, 
  error 
}) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!credentials.email) {
      errors.email = 'Email là bắt buộc';
    } else if (!emailRegex.test(credentials.email)) {
      errors.email = 'Vui lòng nhập email hợp lệ';
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(credentials);
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
        {error && (
          <div className="login-form__error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Demo Accounts Info */}
        <div className="login-form__demo-info">
          <h4>Tài khoản demo:</h4>
          <div className="login-form__demo-accounts">
            <div className="login-form__demo-account">
              <strong>Khách hàng:</strong> customer@evrental.com / 123456
            </div>
            <div className="login-form__demo-account">
              <strong>Nhân viên:</strong> staff@evrental.com / 123456
            </div>
            <div className="login-form__demo-account">
              <strong>Quản trị:</strong> admin@evrental.com / 123456
            </div>
          </div>
        </div>

        {/* Email Field */}
        <div className="login-form__field">
          <label htmlFor="email" className="login-form__label">
            Email *
          </label>
          <div className="login-form__input-wrapper">
            <Mail className="login-form__input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              value={credentials.email}
              onChange={handleInputChange}
              className={`login-form__input ${validationErrors.email ? 'login-form__input--error' : ''}`}
              placeholder="Nhập địa chỉ email của bạn"
            />
          </div>
          {validationErrors.email && (
            <span className="login-form__error">{validationErrors.email}</span>
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
          disabled={isLoading}
          className="login-form__submit-btn btn btn-primary"
        >
          {isLoading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
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