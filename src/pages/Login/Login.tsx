import React, { useState } from 'react';
import { Car } from 'lucide-react';
import LoginForm from '../../components/forms/LoginForm/LoginForm';
import ForgotPasswordForm from '../../components/forms/ForgotPasswordForm/ForgotPasswordForm';
import { LoginCredentials, ForgotPasswordData, User } from '../../types';
import { mockUsers, mockCredentials } from '../../utils/mockData';
import './Login.scss';

type LoginStep = 'login' | 'forgot-password';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onRegister }) => {
  const [currentStep, setCurrentStep] = useState<LoginStep>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  // Handle login submission
  const handleLogin = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check credentials against mock data
      const validCredential = mockCredentials.find(
        cred => cred.email === credentials.email && cred.password === credentials.password
      );

      if (!validCredential) {
        throw new Error('Email hoặc mật khẩu không chính xác');
      }

      // Find user data
      const user = mockUsers.find(u => u.email === credentials.email);
      if (!user) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }

      // Store login info if remember me is checked
      if (credentials.rememberMe) {
        localStorage.setItem('rememberedEmail', credentials.email);
      }

      onLoginSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password submission
  const handleForgotPassword = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if email exists in mock data
      const userExists = mockUsers.some(user => user.email === data.email);
      if (!userExists) {
        throw new Error('Email này không tồn tại trong hệ thống');
      }

      setForgotPasswordSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi email thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation
  const handleForgotPasswordClick = () => {
    setCurrentStep('forgot-password');
    setError('');
    setForgotPasswordSuccess(false);
  };

  const handleBackToLogin = () => {
    setCurrentStep('login');
    setError('');
    setForgotPasswordSuccess(false);
  };

  return (
    <div className="login-page">
      <div className="login-page__background">
        <div className="login-page__background-overlay"></div>
      </div>
      
      <div className="container">
        <div className="login-page__content">
          {/* Logo Section */}
          <div className="login-page__logo">
            <Car className="login-page__logo-icon" />
            <span className="login-page__logo-text">EVRental</span>
          </div>

          {/* Form Section */}
          <div className="login-page__form-container">
            {currentStep === 'login' && (
              <LoginForm
                onSubmit={handleLogin}
                onForgotPassword={handleForgotPasswordClick}
                onRegister={onRegister}
                isLoading={isLoading}
                error={error}
              />
            )}

            {currentStep === 'forgot-password' && (
              <ForgotPasswordForm
                onSubmit={handleForgotPassword}
                onBackToLogin={handleBackToLogin}
                isLoading={isLoading}
                error={error}
                success={forgotPasswordSuccess}
              />
            )}
          </div>

          {/* Features Section */}
          <div className="login-page__features">
            <h3>Tại sao chọn EVRental?</h3>
            <div className="login-page__features-list">
              <div className="login-page__feature">
                <div className="login-page__feature-icon">🚗</div>
                <div className="login-page__feature-content">
                  <h4>Xe điện hiện đại</h4>
                  <p>Đa dạng các loại xe điện từ các thương hiệu hàng đầu</p>
                </div>
              </div>
              <div className="login-page__feature">
                <div className="login-page__feature-icon">⚡</div>
                <div className="login-page__feature-content">
                  <h4>Trạm sạc tiện lợi</h4>
                  <p>Hệ thống trạm sạc rộng khắp thành phố</p>
                </div>
              </div>
              <div className="login-page__feature">
                <div className="login-page__feature-icon">📱</div>
                <div className="login-page__feature-content">
                  <h4>Ứng dụng thông minh</h4>
                  <p>Đặt xe, thanh toán và quản lý dễ dàng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;