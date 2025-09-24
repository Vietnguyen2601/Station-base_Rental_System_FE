/* eslint-disable react-hooks/rules-of-hooks */
import React, { useState } from 'react';
import { CheckCircle, AlertCircle, FileText, Car, User } from 'lucide-react';
import { CheckInData, VehicleInspection, BookingConfirmation, User as UserType } from '../../types';
import './CheckIn.scss';

interface CheckInProps {
  user?: UserType;
}

// Mock booking data - in real app, this would come from API
const mockBooking: BookingConfirmation = {
  id: 'BK1234567890',
  confirmationCode: 'EVRABC123',
  status: 'confirmed',
  bookingData: {
    userId: '1',
    vehicleId: '1',
    stationId: '1',
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    estimatedCost: 150
  }
};

const CheckIn: React.FC<CheckInProps> = ({ user }) => {
  const [checkInStep, setCheckInStep] = useState<'booking' | 'documents' | 'inspection' | 'contract' | 'complete'>('booking');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [checkInData, setCheckInData] = useState<Partial<CheckInData>>({
    bookingId: mockBooking.id,
    staffId: user?.role === 'staff' ? user.id : '',
    documentVerified: false,
    contractSigned: false
  });
  const [inspection, setInspection] = useState<VehicleInspection>({
    batteryLevel: 85,
    exteriorCondition: 'excellent',
    interiorCondition: 'excellent',
    tiresCondition: 'excellent',
    damages: [],
    notes: ''
  });

  // Handle document verification
  const handleDocumentVerification = (verified: boolean, reason?: string) => {
    if (!verified && !reason) {
      setError('Please provide a reason for document rejection');
      return;
    }

    setCheckInData(prev => ({ ...prev, documentVerified: verified }));
    
    if (verified) {
      setCheckInStep('inspection');
      setError('');
    } else {
      setError(`Documents rejected: ${reason}`);
    }
  };

  // Handle inspection update
  const handleInspectionUpdate = (field: keyof VehicleInspection, value: unknown) => {
    setInspection(prev => ({ ...prev, [field]: value }));
  };

  // Handle damage addition
  const handleAddDamage = (damage: string) => {
    if (damage.trim()) {
      setInspection(prev => ({
        ...prev,
        damages: [...prev.damages, damage.trim()]
      }));
    }
  };

  // Handle damage removal
  const handleRemoveDamage = (index: number) => {
    setInspection(prev => ({
      ...prev,
      damages: prev.damages.filter((_, i) => i !== index)
    }));
  };

  // Complete check-in process
  const handleCompleteCheckIn = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Validate all steps completed
      if (!checkInData.documentVerified) {
        throw new Error('Documents must be verified before completing check-in');
      }

      if (!checkInData.contractSigned) {
        throw new Error('Contract must be signed before completing check-in');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const finalCheckInData: CheckInData = {
        ...checkInData as CheckInData,
        vehicleInspection: inspection
      };

      console.log('Check-in completed:', finalCheckInData);
      setCheckInStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Check-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render booking details step
  const renderBookingDetails = () => (
    <div className="checkin__step">
      <div className="checkin__step-header">
        <h2 className="checkin__step-title">Booking Details</h2>
        <p className="checkin__step-subtitle">Verify booking information before proceeding</p>
      </div>

      <div className="checkin__booking-card">
        <div className="checkin__booking-header">
          <div className="checkin__booking-code">
            <h3>Confirmation Code</h3>
            <div className="checkin__code">{mockBooking.confirmationCode}</div>
          </div>
          <div className="checkin__booking-status">
            <CheckCircle className="checkin__status-icon" />
            <span>Confirmed</span>
          </div>
        </div>

        <div className="checkin__booking-details">
          <div className="checkin__detail-item">
            <span className="checkin__detail-label">Booking ID:</span>
            <span className="checkin__detail-value">{mockBooking.id}</span>
          </div>
          <div className="checkin__detail-item">
            <span className="checkin__detail-label">Vehicle:</span>
            <span className="checkin__detail-value">Tesla Model 3 - 2023 Standard Range</span>
          </div>
          <div className="checkin__detail-item">
            <span className="checkin__detail-label">Station:</span>
            <span className="checkin__detail-value">Downtown Hub</span>
          </div>
          <div className="checkin__detail-item">
            <span className="checkin__detail-label">Start Time:</span>
            <span className="checkin__detail-value">{mockBooking.bookingData.startDate.toLocaleString()}</span>
          </div>
          <div className="checkin__detail-item">
            <span className="checkin__detail-label">End Time:</span>
            <span className="checkin__detail-value">{mockBooking.bookingData.endDate.toLocaleString()}</span>
          </div>
          <div className="checkin__detail-item">
            <span className="checkin__detail-label">Estimated Cost:</span>
            <span className="checkin__detail-value">${mockBooking.bookingData.estimatedCost}</span>
          </div>
        </div>

        <div className="checkin__booking-actions">
          <button
            onClick={() => setCheckInStep('documents')}
            className="btn btn-primary"
          >
            Proceed to Document Verification
          </button>
        </div>
      </div>
    </div>
  );

  // Render document verification step
  const renderDocumentVerification = () => {
    const [rejectionReason, setRejectionReason] = useState('');

    return (
      <div className="checkin__step">
        <div className="checkin__step-header">
          <button
            onClick={() => setCheckInStep('booking')}
            className="checkin__back-btn"
          >
            ← Back to Booking Details
          </button>
          <h2 className="checkin__step-title">Document Verification</h2>
          <p className="checkin__step-subtitle">Verify customer documents and identity</p>
        </div>

        {error && (
          <div className="checkin__error">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="checkin__documents">
          <div className="checkin__document-checklist">
            <h3>Required Documents</h3>
            <div className="checkin__checklist">
              <div className="checkin__checklist-item">
                <input type="checkbox" id="license" />
                <label htmlFor="license">Valid Driver's License</label>
              </div>
              <div className="checkin__checklist-item">
                <input type="checkbox" id="id" />
                <label htmlFor="id">Government-issued ID</label>
              </div>
              <div className="checkin__checklist-item">
                <input type="checkbox" id="credit" />
                <label htmlFor="credit">Valid Credit Card</label>
              </div>
              <div className="checkin__checklist-item">
                <input type="checkbox" id="insurance" />
                <label htmlFor="insurance">Insurance Verification (if required)</label>
              </div>
            </div>
          </div>

          <div className="checkin__verification-notes">
            <h3>Verification Notes</h3>
            <textarea
              placeholder="Add any notes about document verification..."
              className="checkin__textarea"
              rows={4}
            />
          </div>

          {user?.role === 'staff' && (
            <div className="checkin__staff-actions">
              <h3>Staff Verification</h3>
              <div className="checkin__verification-actions">
                <button
                  onClick={() => handleDocumentVerification(true)}
                  className="btn btn-primary"
                >
                  <CheckCircle size={16} />
                  Approve Documents
                </button>
                <div className="checkin__rejection">
                  <input
                    type="text"
                    placeholder="Reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="checkin__rejection-input"
                  />
                  <button
                    onClick={() => handleDocumentVerification(false, rejectionReason)}
                    className="btn btn-outline"
                    disabled={!rejectionReason.trim()}
                  >
                    <AlertCircle size={16} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render vehicle inspection step
  const renderVehicleInspection = () => {
    const [newDamage, setNewDamage] = useState('');

    return (
      <div className="checkin__step">
        <div className="checkin__step-header">
          <button
            onClick={() => setCheckInStep('documents')}
            className="checkin__back-btn"
          >
            ← Back to Documents
          </button>
          <h2 className="checkin__step-title">Vehicle Inspection</h2>
          <p className="checkin__step-subtitle">Complete pre-rental vehicle inspection</p>
        </div>

        <div className="checkin__inspection">
          <div className="checkin__inspection-grid">
            <div className="checkin__inspection-section">
              <h3>Battery Level</h3>
              <div className="checkin__battery-display">
                <div className="checkin__battery-bar">
                  <div 
                    className="checkin__battery-fill"
                    style={{ width: `${inspection.batteryLevel}%` }}
                  />
                </div>
                <span className="checkin__battery-text">{inspection.batteryLevel}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={inspection.batteryLevel}
                onChange={(e) => handleInspectionUpdate('batteryLevel', parseInt(e.target.value))}
                className="checkin__range-input"
              />
            </div>

            <div className="checkin__inspection-section">
              <h3>Exterior Condition</h3>
              <select
                value={inspection.exteriorCondition}
                onChange={(e) => handleInspectionUpdate('exteriorCondition', e.target.value)}
                className="checkin__select"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div className="checkin__inspection-section">
              <h3>Interior Condition</h3>
              <select
                value={inspection.interiorCondition}
                onChange={(e) => handleInspectionUpdate('interiorCondition', e.target.value)}
                className="checkin__select"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div className="checkin__inspection-section">
              <h3>Tires Condition</h3>
              <select
                value={inspection.tiresCondition}
                onChange={(e) => handleInspectionUpdate('tiresCondition', e.target.value)}
                className="checkin__select"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div className="checkin__damages-section">
            <h3>Damages & Issues</h3>
            <div className="checkin__damage-input">
              <input
                type="text"
                placeholder="Describe any damage or issues..."
                value={newDamage}
                onChange={(e) => setNewDamage(e.target.value)}
                className="checkin__input"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddDamage(newDamage);
                    setNewDamage('');
                  }
                }}
              />
              <button
                onClick={() => {
                  handleAddDamage(newDamage);
                  setNewDamage('');
                }}
                className="btn btn-outline"
                disabled={!newDamage.trim()}
              >
                Add
              </button>
            </div>

            {inspection.damages.length > 0 && (
              <div className="checkin__damages-list">
                {inspection.damages.map((damage, index) => (
                  <div key={index} className="checkin__damage-item">
                    <span>{damage}</span>
                    <button
                      onClick={() => handleRemoveDamage(index)}
                      className="checkin__damage-remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="checkin__notes-section">
            <h3>Additional Notes</h3>
            <textarea
              value={inspection.notes}
              onChange={(e) => handleInspectionUpdate('notes', e.target.value)}
              placeholder="Add any additional inspection notes..."
              className="checkin__textarea"
              rows={4}
            />
          </div>

          <div className="checkin__inspection-actions">
            <button
              onClick={() => setCheckInStep('contract')}
              className="btn btn-primary"
            >
              Continue to Contract
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render contract signing step
  const renderContractSigning = () => (
    <div className="checkin__step">
      <div className="checkin__step-header">
        <button
          onClick={() => setCheckInStep('inspection')}
          className="checkin__back-btn"
        >
          ← Back to Inspection
        </button>
        <h2 className="checkin__step-title">Contract Signing</h2>
        <p className="checkin__step-subtitle">Review and sign the rental agreement</p>
      </div>

      <div className="checkin__contract">
        <div className="checkin__contract-document">
          <h3>EV Rental Agreement</h3>
          <div className="checkin__contract-content">
            <h4>Terms and Conditions</h4>
            <ul>
              <li>The renter must be at least 21 years old with a valid driver's license</li>
              <li>Vehicle must be returned with at least 20% battery charge</li>
              <li>Any damages will be charged to the renter's credit card</li>
              <li>Late return fees apply after the agreed return time</li>
              <li>The renter is responsible for any traffic violations during the rental period</li>
              <li>Vehicle must be returned to the designated station</li>
            </ul>

            <h4>Liability and Insurance</h4>
            <ul>
              <li>Basic insurance coverage is included in the rental fee</li>
              <li>Renter is liable for damages up to the insurance deductible</li>
              <li>Additional insurance options are available</li>
            </ul>

            <h4>Emergency Procedures</h4>
            <ul>
              <li>In case of emergency, contact 911 first, then EVRental support</li>
              <li>24/7 roadside assistance is available</li>
              <li>Report any accidents or incidents immediately</li>
            </ul>
          </div>
        </div>

        <div className="checkin__signature-section">
          <div className="checkin__signature-field">
            <label>Customer Signature</label>
            <div className="checkin__signature-pad">
              <p>Digital signature pad would be implemented here</p>
              <div className="checkin__signature-placeholder">
                [Customer Signature]
              </div>
            </div>
          </div>

          {user?.role === 'staff' && (
            <div className="checkin__signature-field">
              <label>Staff Signature</label>
              <div className="checkin__signature-pad">
                <div className="checkin__signature-placeholder">
                  [Staff Signature]
                </div>
              </div>
            </div>
          )}

          <div className="checkin__contract-confirmation">
            <label className="checkin__checkbox-label">
              <input
                type="checkbox"
                checked={checkInData.contractSigned}
                onChange={(e) => setCheckInData(prev => ({ ...prev, contractSigned: e.target.checked }))}
              />
              I have read and agree to the terms and conditions of this rental agreement
            </label>
          </div>

          <div className="checkin__contract-actions">
            <button
              onClick={handleCompleteCheckIn}
              disabled={!checkInData.contractSigned || isLoading}
              className="btn btn-primary"
            >
              {isLoading ? 'Completing Check-in...' : 'Complete Check-in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Render completion step
  const renderCompletion = () => (
    <div className="checkin__step">
      <div className="checkin__completion">
        <div className="checkin__completion-header">
          <CheckCircle className="checkin__completion-icon" />
          <h2 className="checkin__completion-title">Check-in Complete!</h2>
          <p className="checkin__completion-subtitle">
            Your rental is now active. Enjoy your ride!
          </p>
        </div>

        <div className="checkin__completion-details">
          <h3>Rental Information</h3>
          <div className="checkin__completion-grid">
            <div className="checkin__detail-item">
              <span className="checkin__detail-label">Vehicle:</span>
              <span className="checkin__detail-value">Tesla Model 3</span>
            </div>
            <div className="checkin__detail-item">
              <span className="checkin__detail-label">Battery Level:</span>
              <span className="checkin__detail-value">{inspection.batteryLevel}%</span>
            </div>
            <div className="checkin__detail-item">
              <span className="checkin__detail-label">Return By:</span>
              <span className="checkin__detail-value">{mockBooking.bookingData.endDate.toLocaleString()}</span>
            </div>
          </div>

          <div className="checkin__important-info">
            <h4>Important Reminders</h4>
            <ul>
              <li>Return the vehicle with at least 20% battery charge</li>
              <li>Contact support immediately if you encounter any issues</li>
              <li>Keep your confirmation code for the return process</li>
              <li>Drive safely and follow all traffic laws</li>
            </ul>
          </div>
        </div>

        <div className="checkin__completion-actions">
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            Start Your Journey
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
    <div className="checkin">
      <div className="container">
        <div className="checkin__content">
          {/* Progress Indicator */}
          <div className="checkin__progress">
            <div className={`checkin__progress-step ${checkInStep === 'booking' ? 'active' : ['documents', 'inspection', 'contract', 'complete'].includes(checkInStep) ? 'completed' : ''}`}>
              <div className="checkin__progress-circle">
                <FileText size={16} />
              </div>
              <span>Booking</span>
            </div>
            <div className="checkin__progress-line"></div>
            <div className={`checkin__progress-step ${checkInStep === 'documents' ? 'active' : ['inspection', 'contract', 'complete'].includes(checkInStep) ? 'completed' : ''}`}>
              <div className="checkin__progress-circle">
                <User size={16} />
              </div>
              <span>Documents</span>
            </div>
            <div className="checkin__progress-line"></div>
            <div className={`checkin__progress-step ${checkInStep === 'inspection' ? 'active' : ['contract', 'complete'].includes(checkInStep) ? 'completed' : ''}`}>
              <div className="checkin__progress-circle">
                <Car size={16} />
              </div>
              <span>Inspection</span>
            </div>
            <div className="checkin__progress-line"></div>
            <div className={`checkin__progress-step ${checkInStep === 'contract' ? 'active' : checkInStep === 'complete' ? 'completed' : ''}`}>
              <div className="checkin__progress-circle">
                <FileText size={16} />
              </div>
              <span>Contract</span>
            </div>
            <div className="checkin__progress-line"></div>
            <div className={`checkin__progress-step ${checkInStep === 'complete' ? 'active' : ''}`}>
              <div className="checkin__progress-circle">
                <CheckCircle size={16} />
              </div>
              <span>Complete</span>
            </div>
          </div>

          {/* Step Content */}
          {checkInStep === 'booking' && renderBookingDetails()}
          {checkInStep === 'documents' && renderDocumentVerification()}
          {checkInStep === 'inspection' && renderVehicleInspection()}
          {checkInStep === 'contract' && renderContractSigning()}
          {checkInStep === 'complete' && renderCompletion()}
        </div>
      </div>
    </div>
  );
};

export default CheckIn;