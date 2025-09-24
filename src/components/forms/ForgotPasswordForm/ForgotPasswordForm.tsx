import React, { useState } from 'react';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { ForgotPasswordFormProps, ForgotPasswordData } from '../../../types';
import './ForgotPasswordForm.scss';

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ 
  onSubmit, 
  onBackToLogin, 
  isLoading, 
  error,
  success 
}) => {
  const [formData, setFormData] = useState<ForgotPasswordData>({
    email: ''
  });
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
    if (!formData.email) {
      errors.email = 'Email là bắt buộc';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Vui lòng nhập email hợp lệ';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  if (success) {
    return (
      <div className="forgot-password-form">
        <div className="forgot-password-form__success">
          <CheckCircle className="forgot-password-form__success-icon" />
          <h2 className="forgot-password-form__success-title">Email đã được gửi!</h2>
          <p className="forgot-password-form__success-message">
            Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email <strong>{formData.email}</strong>. 
            Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
          </p>
          <div className="forgot-password-form__success-actions">
            <button
              onClick={onBackToLogin}
              className="btn btn-primary"
            >
              Quay lại đăng nhập
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline"
            >
              Gửi lại email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-form">
      <div className="forgot-password-form__header">
        <button
          onClick={onBackToLogin}
          className="forgot-password-form__back-btn"
        >
          <ArrowLeft size={20} />
          Quay lại đăng nhập
        </button>
        <h2 className="forgot-password-form__title">Quên Mật Khẩu</h2>
        <p className="forgot-password-form__subtitle">
          Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu
        </p>
      </div>

      <form onSubmit={handleSubmit} className="forgot-password-form__form">
        {/* Global Error Message */}
        {error && (
          <div className="forgot-password-form__error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="forgot-password-form__field">
          <label htmlFor="email" className="forgot-password-form__label">
            Email *
          </label>
          <div className="forgot-password-form__input-wrapper">
            <Mail className="forgot-password-form__input-icon" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`forgot-password-form__input ${validationErrors.email ? 'forgot-password-form__input--error' : ''}`}
              placeholder="Nhập địa chỉ email của bạn"
            />
          </div>
          {validationErrors.email && (
            <span className="forgot-password-form__error">{validationErrors.email}</span>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="forgot-password-form__submit-btn btn btn-primary"
        >
          {isLoading ? 'Đang gửi...' : 'Gửi hướng dẫn đặt lại'}
        </button>

        {/* Additional Info */}
        <div className="forgot-password-form__info">
          <p>
            Bạn sẽ nhận được email với liên kết để đặt lại mật khẩu. 
            Liên kết này sẽ hết hạn sau 24 giờ.
          </p>
        </div>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;