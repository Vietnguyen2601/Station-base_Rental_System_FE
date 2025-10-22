import React, { useState, useEffect } from 'react';
import { X, Calendar, CreditCard, FileText, CheckCircle, Clock, MapPin, ChevronDown } from 'lucide-react';
import { NewVehicleCardData, Station } from '../../types';
import { mockStations } from '../../utils/vehicleMockData';
import './BookingModal.scss';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: NewVehicleCardData;
  onConfirmBooking: (bookingData: BookingData) => void;
}

interface BookingData {
  customerInfo: {
    name: string;
    phone: string;
    email: string;
  };
  bookingInfo: {
    stationId: string;
    returnDate: string;
    discountCode: string;
    paymentMethod: 'vnpay' | 'cash';
    agreeTerms: boolean;
  };
  totalAmount: number;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, vehicle, onConfirmBooking }) => {
  const [formData, setFormData] = useState<BookingData>({
    customerInfo: {
      name: '',
      phone: '',
      email: ''
    },
    bookingInfo: {
      stationId: '',
      returnDate: '',
      discountCode: '',
      paymentMethod: 'vnpay',
      agreeTerms: false
    },
    totalAmount: vehicle.price_per_hour * 24 // Default 24 hours
  });

  const [availableStations, setAvailableStations] = useState<Station[]>([]);
  const [isStationDropdownOpen, setIsStationDropdownOpen] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Filter stations that have this vehicle model
  useEffect(() => {
    if (vehicle) {
      // For demo purposes, we'll show all stations
      // In real app, this would filter based on vehicle availability
      setAvailableStations(mockStations);
      if (mockStations.length > 0) {
        setFormData(prev => ({
          ...prev,
          bookingInfo: {
            ...prev.bookingInfo,
            stationId: mockStations[0].id
          }
        }));
      }
    }
  }, [vehicle]);

  if (!isOpen) return null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate customer info
    if (!formData.customerInfo.name.trim()) {
      newErrors.name = 'Vui lòng nhập tên';
    }
    if (!formData.customerInfo.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại';
    } else if (!/^[0-9]{10,11}$/.test(formData.customerInfo.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
    }
    if (!formData.customerInfo.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerInfo.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Validate booking info
    if (!formData.bookingInfo.stationId) {
      newErrors.stationId = 'Vui lòng chọn trạm';
    }
    if (!formData.bookingInfo.returnDate) {
      newErrors.returnDate = 'Vui lòng chọn ngày trả xe';
    }
    if (!formData.bookingInfo.agreeTerms) {
      newErrors.agreeTerms = 'Vui lòng đồng ý với điều khoản';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleNestedInputChange = (parent: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof BookingData],
        [field]: value
      }
    }));
    // Clear error when user starts typing
    const errorKey = `${parent}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => ({
        ...prev,
        [errorKey]: ''
      }));
    }
  };

  const calculateTotal = () => {
    let total = vehicle.price_per_hour * 24; // Default 24 hours
    if (formData.bookingInfo.discountCode === 'SAVE10') {
      total = total * 0.9; // 10% discount
    }
    return total;
  };

  const handleConfirm = () => {
    if (validateForm()) {
      onConfirmBooking({
        ...formData,
        totalAmount: calculateTotal()
      });
    }
  };

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        {/* Header */}
        <div className="booking-modal__header">
          <h2 className="booking-modal__title">Đặt xe {vehicle.name}</h2>
          <button onClick={onClose} className="booking-modal__close">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="booking-modal__content">
          <div className="booking-form">
            {/* Customer Information Section */}
            <div className="form-section">
              <h3 className="section-title">
                <FileText size={20} />
                Thông tin người thuê
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Họ và tên *</label>
                  <input
                    type="text"
                    className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                    value={formData.customerInfo.name}
                    onChange={(e) => handleNestedInputChange('customerInfo', 'name', e.target.value)}
                    placeholder="Nhập họ và tên"
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Số điện thoại *</label>
                  <input
                    type="tel"
                    className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
                    value={formData.customerInfo.phone}
                    onChange={(e) => handleNestedInputChange('customerInfo', 'phone', e.target.value)}
                    placeholder="Nhập số điện thoại"
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                    value={formData.customerInfo.email}
                    onChange={(e) => handleNestedInputChange('customerInfo', 'email', e.target.value)}
                    placeholder="Nhập email"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>
            </div>

            {/* Booking Information Section */}
            <div className="form-section">
              <h3 className="section-title">
                <Calendar size={20} />
                Thông tin đặt xe
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Chọn trạm *</label>
                  <div className="station-selector">
                    <button
                      type="button"
                      className={`station-selector__button ${errors.stationId ? 'form-input--error' : ''}`}
                      onClick={() => setIsStationDropdownOpen(!isStationDropdownOpen)}
                    >
                      <MapPin size={16} />
                      <span>
                        {formData.bookingInfo.stationId 
                          ? availableStations.find(s => s.id === formData.bookingInfo.stationId)?.name
                          : 'Chọn trạm'
                        }
                      </span>
                      <ChevronDown size={16} className={`chevron ${isStationDropdownOpen ? 'chevron--open' : ''}`} />
                    </button>
                    
                    {isStationDropdownOpen && (
                      <div className="station-selector__dropdown">
                        {availableStations.map((station) => (
                          <button
                            key={station.id}
                            type="button"
                            className={`station-option ${formData.bookingInfo.stationId === station.id ? 'station-option--selected' : ''}`}
                            onClick={() => {
                              handleNestedInputChange('bookingInfo', 'stationId', station.id);
                              setIsStationDropdownOpen(false);
                            }}
                          >
                            <div className="station-option__info">
                              <div className="station-option__name">{station.name}</div>
                              <div className="station-option__address">{station.address}</div>
                              <div className="station-option__availability">
                                {station.availableVehicles}/{station.totalVehicles} xe có sẵn
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.stationId && <span className="error-message">{errors.stationId}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label">Ngày trả xe *</label>
                  <input
                    type="date"
                    className={`form-input ${errors.returnDate ? 'form-input--error' : ''}`}
                    value={formData.bookingInfo.returnDate}
                    onChange={(e) => handleNestedInputChange('bookingInfo', 'returnDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  {errors.returnDate && <span className="error-message">{errors.returnDate}</span>}
                </div>
              </div>

              <div className="form-row">

                <div className="form-group">
                  <label className="form-label">Mã giảm giá</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.bookingInfo.discountCode}
                    onChange={(e) => handleNestedInputChange('bookingInfo', 'discountCode', e.target.value)}
                    placeholder="Nhập mã giảm giá (VD: SAVE10)"
                  />
                  <small className="form-hint">Mã giảm giá có sẵn: SAVE10 (giảm 10%)</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phương thức thanh toán *</label>
                  <div className="payment-methods">
                    <label className="payment-method">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="vnpay"
                        checked={formData.bookingInfo.paymentMethod === 'vnpay'}
                        onChange={(e) => handleNestedInputChange('bookingInfo', 'paymentMethod', e.target.value)}
                      />
                      <div className="payment-method-content">
                        <CreditCard size={16} />
                        <span>VNPay</span>
                      </div>
                    </label>
                    <label className="payment-method">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={formData.bookingInfo.paymentMethod === 'cash'}
                        onChange={(e) => handleNestedInputChange('bookingInfo', 'paymentMethod', e.target.value)}
                      />
                      <div className="payment-method-content">
                        <Clock size={16} />
                        <span>Tiền mặt</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.bookingInfo.agreeTerms}
                      onChange={(e) => handleNestedInputChange('bookingInfo', 'agreeTerms', e.target.checked)}
                    />
                    <span className="checkbox-text">
                      Tôi đồng ý với <a href="#" className="terms-link">điều khoản</a>
                    </span>
                  </label>
                  {errors.agreeTerms && <span className="error-message">{errors.agreeTerms}</span>}
                </div>
              </div>
            </div>

            {/* Payment Summary Section */}
            <div className="form-section">
              <h3 className="section-title">
                <CreditCard size={20} />
                Tổng kết thanh toán
              </h3>
              
              <div className="form-row">
                <div className="form-group">
                  <div className="payment-summary">
                    <div className="summary-item">
                      <span>Xe thuê:</span>
                      <span>{vehicle.name}</span>
                    </div>
                    <div className="summary-item">
                      <span>Giá/giờ:</span>
                      <span>{vehicle.price_per_hour.toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                    <div className="summary-item">
                      <span>Thời gian:</span>
                      <span>24 giờ</span>
                    </div>
                    {formData.bookingInfo.discountCode === 'SAVE10' && (
                      <div className="summary-item discount">
                        <span>Giảm giá:</span>
                        <span>-{(vehicle.price_per_hour * 24 * 0.1).toLocaleString('vi-VN')} VNĐ</span>
                      </div>
                    )}
                    <div className="summary-item total">
                      <span>Tổng tiền:</span>
                      <span>{calculateTotal().toLocaleString('vi-VN')} VNĐ</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="payment-method-summary">
                    <h4>Phương thức thanh toán:</h4>
                    <div className="selected-payment">
                      {formData.bookingInfo.paymentMethod === 'vnpay' ? (
                        <>
                          <CreditCard size={20} />
                          <span>VNPay</span>
                        </>
                      ) : (
                        <>
                          <Clock size={20} />
                          <span>Tiền mặt</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="booking-modal__footer">
          <button onClick={handleConfirm} className="btn btn--primary btn--large">
            <CheckCircle size={20} />
            Xác nhận đặt xe
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
