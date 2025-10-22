import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import RegisterForm from '../../components/forms/RegisterForm/RegisterForm';
import { RegistrationData } from '../../types';
import './Register.scss';

interface RegisterProps {
  onBack?: () => void;
}

const Register: React.FC<RegisterProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Handle registration form submission
  const handleRegistration = async (data: RegistrationData) => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call for registration
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock validation - in real app, this would be server-side
      if (data.email === 'test@error.com') {
        throw new Error('Email already exists. Please use a different email address.');
      }

      // Registration successful
      setSuccess(true);
      console.log('Registration successful:', data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="register">
        <div className="register__content">
          <div className="register__success">
            <div className="register__success-header">
              <h2 className="register__success-title">Đăng ký thành công!</h2>
              <p className="register__success-subtitle">
                Tài khoản của bạn đã được tạo thành công. Bạn có thể đăng nhập ngay bây giờ.
              </p>
            </div>
            <div className="register__success-actions">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="register__back-btn"
                >
                  <ArrowLeft size={20} />
                  Quay lại đăng nhập
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register">
      <div className="register__content">
        {onBack && (
          <div className="register__back-button">
            <button
              type="button"
              onClick={onBack}
              className="register__back-btn"
            >
              <ArrowLeft size={20} />
              Quay lại
            </button>
          </div>
        )}
        <RegisterForm
          onSubmit={handleRegistration}
          isLoading={isLoading}
          error={error}
        />
      </div>
    </div>
  );
};

export default Register;