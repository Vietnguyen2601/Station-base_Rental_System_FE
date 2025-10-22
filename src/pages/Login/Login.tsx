import React, { useState } from 'react';
import { Car, ArrowLeft } from 'lucide-react';
import LoginForm from '../../components/forms/LoginForm/LoginForm';
import ForgotPasswordForm from '../../components/forms/ForgotPasswordForm/ForgotPasswordForm';
import { User } from '../../types';
import './Login.scss';

type LoginStep = 'login' | 'forgot-password';

interface LoginProps {
  onLoginSuccess: (credentials: { user: User }) => void;
  onRegister: () => void;
  onBack?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess, onRegister, onBack }) => {
  const [currentStep, setCurrentStep] = useState<LoginStep>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  // Handle login submission
  const handleLogin = async (credentials: { user: User }) => {
    setIsLoading(true);
    setError('');

    try {
      onLoginSuccess(credentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password submission
  const handleForgotPassword = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, always succeed
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
      
      {/* Back Button */}
      {onBack && (
        <div className="login-page__back-button">
          <button
            type="button"
            onClick={onBack}
            className="login-page__back-btn"
          >
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>
      )}

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
        </div>
      </div>
    </div>
  );
};

export default Login;