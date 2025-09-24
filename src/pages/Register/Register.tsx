import React, { useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import RegisterForm from '../../components/forms/RegisterForm/RegisterForm';
import { RegistrationData, VerificationData } from '../../types';
import './Register.scss';

// Registration flow states
type RegistrationStep = 'form' | 'verification' | 'pending' | 'approved' | 'rejected';

const Register: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');

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

      setRegistrationData(data);
      setCurrentStep('verification');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle verification code submission
  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call for verification
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock verification - in real app, this would validate against server
      if (verificationCode !== '123456') {
        throw new Error('Invalid verification code. Please check your email and try again.');
      }

      setCurrentStep('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Verification code sent to your email!');
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render registration form step
  const renderFormStep = () => (
    <div className="register__step">
      <RegisterForm
        onSubmit={handleRegistration}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );

  // Render verification step
  const renderVerificationStep = () => (
    <div className="register__step">
      <div className="register__verification">
        <div className="register__verification-header">
          <CheckCircle className="register__verification-icon" />
          <h2 className="register__verification-title">Check Your Email</h2>
          <p className="register__verification-subtitle">
            We've sent a 6-digit verification code to{' '}
            <strong>{registrationData?.email}</strong>
          </p>
        </div>

        <form onSubmit={handleVerification} className="register__verification-form">
          {error && (
            <div className="register__error-banner">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="register__verification-field">
            <label htmlFor="verificationCode" className="register__label">
              Verification Code
            </label>
            <input
              type="text"
              id="verificationCode"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              className="register__verification-input"
              placeholder="Enter 6-digit code"
              maxLength={6}
              pattern="[0-9]{6}"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || verificationCode.length !== 6}
            className="register__submit-btn btn btn-primary"
          >
            {isLoading ? 'Verifying...' : 'Verify Email'}
          </button>

          <div className="register__verification-actions">
            <p className="register__verification-text">
              Didn't receive the code?{' '}
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="register__link-btn"
              >
                Resend Code
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );

  // Render pending approval step
  const renderPendingStep = () => (
    <div className="register__step">
      <div className="register__status">
        <div className="register__status-header">
          <Clock className="register__status-icon register__status-icon--pending" />
          <h2 className="register__status-title">Pending Staff Approval</h2>
          <p className="register__status-subtitle">
            Your account is being reviewed by our staff. This process typically takes 1-2 business days.
          </p>
        </div>

        <div className="register__status-details">
          <h3 className="register__status-details-title">What happens next?</h3>
          <ul className="register__status-list">
            <li>Our staff will verify your uploaded documents</li>
            <li>We'll conduct a background check for safety</li>
            <li>You'll receive an email notification once approved</li>
            <li>After approval, you can start renting vehicles immediately</li>
          </ul>
        </div>

        <div className="register__status-actions">
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            Return to Home
          </button>
          <button
            onClick={() => window.location.href = '/support'}
            className="btn btn-outline"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="register">
      <div className="container">
        <div className="register__content">
          {/* Progress Indicator */}
          <div className="register__progress">
            <div className={`register__progress-step ${currentStep === 'form' ? 'active' : currentStep !== 'form' ? 'completed' : ''}`}>
              <div className="register__progress-circle">1</div>
              <span className="register__progress-label">Registration</span>
            </div>
            <div className="register__progress-line"></div>
            <div className={`register__progress-step ${currentStep === 'verification' ? 'active' : ['pending', 'approved', 'rejected'].includes(currentStep) ? 'completed' : ''}`}>
              <div className="register__progress-circle">2</div>
              <span className="register__progress-label">Verification</span>
            </div>
            <div className="register__progress-line"></div>
            <div className={`register__progress-step ${['pending', 'approved', 'rejected'].includes(currentStep) ? 'active' : ''}`}>
              <div className="register__progress-circle">3</div>
              <span className="register__progress-label">Approval</span>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 'form' && renderFormStep()}
          {currentStep === 'verification' && renderVerificationStep()}
          {currentStep === 'pending' && renderPendingStep()}
        </div>
      </div>
    </div>
  );
};

export default Register;