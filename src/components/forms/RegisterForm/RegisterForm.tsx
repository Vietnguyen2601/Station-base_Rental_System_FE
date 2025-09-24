import React, { useState } from 'react';
import { Upload, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { RegisterFormProps, RegistrationData } from '../../../types';
import './RegisterForm.scss';

const RegisterForm: React.FC<RegisterFormProps> = ({ onSubmit, isLoading, error }) => {
  const [formData, setFormData] = useState<RegistrationData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<{
    license?: File;
    id?: File;
  }>({});

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'id') => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setValidationErrors(prev => ({
          ...prev,
          [type]: 'Please upload a valid image (JPG, PNG) or PDF file'
        }));
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setValidationErrors(prev => ({
          ...prev,
          [type]: 'File size must be less than 5MB'
        }));
        return;
      }

      setUploadedFiles(prev => ({ ...prev, [type]: file }));
      setFormData(prev => ({ ...prev, [`${type}File`]: file }));
      
      // Clear validation error
      if (validationErrors[type]) {
        setValidationErrors(prev => ({ ...prev, [type]: '' }));
      }
    }
  };

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Name validation
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    // Phone validation
    const phoneRegex = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }

    // File validation
    if (!uploadedFiles.license) {
      errors.license = 'Driver\'s license is required';
    }
    if (!uploadedFiles.id) {
      errors.id = 'Government ID is required';
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
        {error && (
          <div className="register-form__error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Personal Information */}
        <div className="register-form__section">
          <h3 className="register-form__section-title">Personal Information</h3>
          
          <div className="register-form__row">
            <div className="register-form__field">
              <label htmlFor="firstName" className="register-form__label">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={`register-form__input ${validationErrors.firstName ? 'register-form__input--error' : ''}`}
                placeholder="Enter your first name"
              />
              {validationErrors.firstName && (
                <span className="register-form__error">{validationErrors.firstName}</span>
              )}
            </div>

            <div className="register-form__field">
              <label htmlFor="lastName" className="register-form__label">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={`register-form__input ${validationErrors.lastName ? 'register-form__input--error' : ''}`}
                placeholder="Enter your last name"
              />
              {validationErrors.lastName && (
                <span className="register-form__error">{validationErrors.lastName}</span>
              )}
            </div>
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
            <label htmlFor="phone" className="register-form__label">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`register-form__input ${validationErrors.phone ? 'register-form__input--error' : ''}`}
              placeholder="Enter your phone number"
            />
            {validationErrors.phone && (
              <span className="register-form__error">{validationErrors.phone}</span>
            )}
          </div>
        </div>

        {/* Password Section */}
        <div className="register-form__section">
          <h3 className="register-form__section-title">Security</h3>
          
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
        </div>

        {/* Document Upload Section */}
        <div className="register-form__section">
          <h3 className="register-form__section-title">Document Verification</h3>
          <p className="register-form__section-description">
            Please upload clear photos or scans of your documents for verification
          </p>

          <div className="register-form__row">
            <div className="register-form__field">
              <label className="register-form__label">Driver's License *</label>
              <div className="register-form__file-upload">
                <input
                  type="file"
                  id="license"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'license')}
                  className="register-form__file-input"
                />
                <label htmlFor="license" className="register-form__file-label">
                  <Upload size={20} />
                  <span>
                    {uploadedFiles.license ? uploadedFiles.license.name : 'Upload License'}
                  </span>
                </label>
                {uploadedFiles.license && (
                  <div className="register-form__file-success">
                    <CheckCircle size={16} />
                    <span>File uploaded successfully</span>
                  </div>
                )}
              </div>
              {validationErrors.license && (
                <span className="register-form__error">{validationErrors.license}</span>
              )}
            </div>

            <div className="register-form__field">
              <label className="register-form__label">Government ID *</label>
              <div className="register-form__file-upload">
                <input
                  type="file"
                  id="id"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'id')}
                  className="register-form__file-input"
                />
                <label htmlFor="id" className="register-form__file-label">
                  <Upload size={20} />
                  <span>
                    {uploadedFiles.id ? uploadedFiles.id.name : 'Upload ID'}
                  </span>
                </label>
                {uploadedFiles.id && (
                  <div className="register-form__file-success">
                    <CheckCircle size={16} />
                    <span>File uploaded successfully</span>
                  </div>
                )}
              </div>
              {validationErrors.id && (
                <span className="register-form__error">{validationErrors.id}</span>
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="register-form__actions">
          <button
            type="submit"
            disabled={isLoading}
            className="register-form__submit-btn btn btn-primary"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
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