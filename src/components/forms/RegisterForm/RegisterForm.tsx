import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { RegisterFormProps, RegistrationData } from '../../../types';
import authService, { ApiError } from '../../../services/authService';
import './RegisterForm.scss';

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState<RegistrationData>({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    contactNumber: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

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

    // Username validation
    if (!formData.username.trim()) {
      errors.username = 'Username là bắt buộc';
    } else if (formData.username.length < 3) {
      errors.username = 'Username phải có ít nhất 3 ký tự';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email là bắt buộc';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Vui lòng nhập email hợp lệ';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 8) {
      errors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Mật khẩu phải chứa chữ hoa, chữ thường và số';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu là bắt buộc';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    // Contact number validation
    const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
    if (!formData.contactNumber) {
      errors.contactNumber = 'Số điện thoại là bắt buộc';
    } else if (!phoneRegex.test(formData.contactNumber)) {
      errors.contactNumber = 'Vui lòng nhập số điện thoại hợp lệ';
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
      const response = await authService.register({
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        email: formData.email,
        contactNumber: formData.contactNumber
      });

      // Save user data
      authService.saveCurrentUser(response.user);
      
      // Call parent onSubmit with user data
      onSubmit(formData);
      
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        setSubmitError(error.message);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        setSubmitError((error as ApiError).message);
      } else {
        setSubmitError('Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-form">
      <div className="register-form__header">
        <h2 className="register-form__title">Create Your Account</h2>
        <p className="register-form__subtitle">
          Join EVRental to access sustainable transportation solutions
        </p>
      </div>

      <form onSubmit={handleSubmit} className="register-form__form">
        {/* Global Error Message */}
        {(error || submitError) && (
          <div className="register-form__error-banner">
            <AlertCircle size={20} />
            <span>{error || submitError}</span>
          </div>
        )}

        {/* Registration Form */}
        <div className="register-form__section">
          <div className="register-form__field">
            <label htmlFor="username" className="register-form__label">
              Username *
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`register-form__input ${validationErrors.username ? 'register-form__input--error' : ''}`}
              placeholder="Enter your username"
            />
            {validationErrors.username && (
              <span className="register-form__error">{validationErrors.username}</span>
            )}
          </div>

          <div className="register-form__field">
            <label htmlFor="email" className="register-form__label">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`register-form__input ${validationErrors.email ? 'register-form__input--error' : ''}`}
              placeholder="Enter your email address"
            />
            {validationErrors.email && (
              <span className="register-form__error">{validationErrors.email}</span>
            )}
          </div>

          <div className="register-form__field">
            <label htmlFor="password" className="register-form__label">
              Password *
            </label>
            <div className="register-form__password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`register-form__input ${validationErrors.password ? 'register-form__input--error' : ''}`}
                placeholder="Create a strong password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="register-form__password-toggle"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {validationErrors.password && (
              <span className="register-form__error">{validationErrors.password}</span>
            )}
          </div>

          <div className="register-form__field">
            <label htmlFor="confirmPassword" className="register-form__label">
              Confirm Password *
            </label>
            <div className="register-form__password-field">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={`register-form__input ${validationErrors.confirmPassword ? 'register-form__input--error' : ''}`}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="register-form__password-toggle"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            {validationErrors.confirmPassword && (
              <span className="register-form__error">{validationErrors.confirmPassword}</span>
            )}
          </div>

          <div className="register-form__field">
            <label htmlFor="contactNumber" className="register-form__label">
              Contact Number *
            </label>
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              className={`register-form__input ${validationErrors.contactNumber ? 'register-form__input--error' : ''}`}
              placeholder="Enter your contact number"
            />
            {validationErrors.contactNumber && (
              <span className="register-form__error">{validationErrors.contactNumber}</span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="register-form__actions">
          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="register-form__submit-btn btn btn-primary"
          >
            {(isLoading || isSubmitting) ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>

        {/* Terms and Privacy */}
        <div className="register-form__terms">
          <p>
            By creating an account, you agree to our{' '}
            <a href="/terms" className="register-form__link">Terms of Service</a>
            {' '}and{' '}
            <a href="/privacy" className="register-form__link">Privacy Policy</a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default RegisterForm;