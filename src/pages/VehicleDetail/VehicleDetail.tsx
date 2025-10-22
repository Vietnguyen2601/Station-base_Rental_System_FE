import React, { useState, useEffect } from 'react';
import { ArrowLeft, Battery, MapPin, Clock, Shield, CheckCircle, Star, Car, Zap, AlertCircle } from 'lucide-react';
import { NewVehicleCardData } from '../../types';
import { mockVehicles, mockVehicleModels, mockVehicleTypes } from '../../utils/vehicleMockData';
import NewVehicleCard from '../../components/NewVehicleCard/NewVehicleCard';
import BookingModal from '../../components/BookingModal/BookingModal';
import './VehicleDetail.scss';

interface VehicleDetailProps {
  vehicleId: string;
  onBack: () => void;
  onRentVehicle: (vehicle: NewVehicleCardData) => void;
  userRole: 'customer' | 'staff' | 'admin';
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({ 
  vehicleId, 
  onBack, 
  onRentVehicle, 
  userRole 
}) => {
  const [vehicle, setVehicle] = useState<NewVehicleCardData | null>(null);
  const [relatedVehicles, setRelatedVehicles] = useState<NewVehicleCardData[]>([]);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    // Find vehicle by ID
    const foundVehicle = mockVehicles.find(v => v.vehicle_id === vehicleId);
    if (foundVehicle) {
      const model = mockVehicleModels.find(m => m.vehicle_model_id === foundVehicle.model_id);
      const type = model ? mockVehicleTypes.find(t => t.vehicle_type_id === model.type_id) : undefined;

      const vehicleData: NewVehicleCardData = {
        vehicle_id: foundVehicle.vehicle_id,
        name: model ? `${model.manufacturer} ${model.name}` : 'Unknown Vehicle',
        price_per_hour: model?.price_per_hour || 0,
        battery_capacity: foundVehicle.battery_capacity || 0,
        range: foundVehicle.range || 0,
        type_name: type?.type_name || 'Unknown Type',
        status: foundVehicle.status,
        img: foundVehicle.img,
        battery_level: foundVehicle.battery_level,
        color: foundVehicle.color
      };

      setVehicle(vehicleData);

      // Get related vehicles (same type, different vehicles)
      const relatedVehiclesData = mockVehicles
        .filter(v => v.vehicle_id !== vehicleId && v.isActive)
        .slice(0, 2)
        .map(v => {
          const relatedModel = mockVehicleModels.find(m => m.vehicle_model_id === v.model_id);
          const relatedType = relatedModel ? mockVehicleTypes.find(t => t.vehicle_type_id === relatedModel.type_id) : undefined;

          return {
            vehicle_id: v.vehicle_id,
            name: relatedModel ? `${relatedModel.manufacturer} ${relatedModel.name}` : 'Unknown Vehicle',
            price_per_hour: relatedModel?.price_per_hour || 0,
            battery_capacity: v.battery_capacity || 0,
            range: v.range || 0,
            type_name: relatedType?.type_name || 'Unknown Type',
            status: v.status,
            img: v.img,
            battery_level: v.battery_level,
            color: v.color
          };
        });

      setRelatedVehicles(relatedVehiclesData);
    }
  }, [vehicleId]);

  const getStatusIcon = () => {
    if (!vehicle) return null;
    switch (vehicle.status) {
      case 'AVAILABLE':
        return <CheckCircle size={20} className="status-icon success" />;
      case 'CHARGING':
        return <Zap size={20} className="status-icon info" />;
      case 'RENTED':
        return <Clock size={20} className="status-icon warning" />;
      case 'MAINTENANCE':
        return <AlertCircle size={20} className="status-icon error" />;
      default:
        return <AlertCircle size={20} className="status-icon error" />;
    }
  };

  const getStatusText = () => {
    if (!vehicle) return '';
    switch (vehicle.status) {
      case 'AVAILABLE':
        return 'Có sẵn';
      case 'CHARGING':
        return 'Đang sạc';
      case 'RENTED':
        return 'Đang thuê';
      case 'MAINTENANCE':
        return 'Bảo trì';
      default:
        return 'Không rõ';
    }
  };

  const getBatteryColor = () => {
    if (!vehicle?.battery_level) return 'error';
    if (vehicle.battery_level > 70) return 'success';
    if (vehicle.battery_level > 30) return 'warning';
    return 'error';
  };

  const canRent = vehicle?.status === 'AVAILABLE' && (vehicle?.battery_level || 0) > 20;

  const handleBookingConfirm = (bookingData: {
    customerInfo: { name: string; phone: string; email: string };
    bookingInfo: { returnDate: string; discountCode: string; paymentMethod: string; agreeTerms: boolean };
    totalAmount: number;
  }) => {
    console.log('Booking confirmed:', bookingData);
    alert(`Đặt xe thành công! Tổng tiền: ${bookingData.totalAmount.toLocaleString('vi-VN')} VNĐ`);
    setIsBookingModalOpen(false);
  };

  if (!vehicle) {
    return (
      <div className="vehicle-detail">
        <div className="container">
          <div className="vehicle-detail__not-found">
            <h2>Không tìm thấy xe</h2>
            <button onClick={onBack} className="btn btn--primary">
              <ArrowLeft size={16} />
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-detail">
      <div className="container">
        {/* Header */}
        <div className="vehicle-detail__header">
          <button onClick={onBack} className="vehicle-detail__back-btn">
            <ArrowLeft size={20} />
            Quay lại
          </button>
        </div>

        {/* Main Content */}
        <div className="vehicle-detail__content">
          {/* Left Side - Image */}
          <div className="vehicle-detail__image-section">
            <div className="vehicle-detail__image-wrapper">
              {vehicle.img ? (
                <img 
                  src={vehicle.img} 
                  alt={vehicle.name}
                  className="vehicle-detail__image"
                />
              ) : (
                <div className="vehicle-detail__image-placeholder">
                  <Car size={120} />
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Info & Actions */}
          <div className="vehicle-detail__info-section">
            {/* Vehicle Info */}
            <div className="vehicle-detail__info">
              <div className="vehicle-detail__status">
                {getStatusIcon()}
                <span className={`status-text status-text--${getStatusText().toLowerCase().replace(' ', '-')}`}>
                  {getStatusText()}
                </span>
              </div>

              <h1 className="vehicle-detail__title">{vehicle.name}</h1>
              <p className="vehicle-detail__type">{vehicle.type_name}</p>

              {/* Key Features */}
              <div className="vehicle-detail__features">
                <div className="features-grid">
                  <div className="feature-item">
                    <Battery className="feature-icon" size={20} />
                    <div className="feature-content">
                      <span className="feature-label">Dung lượng pin</span>
                      <span className="feature-value">{vehicle.battery_capacity} kWh</span>
                    </div>
                  </div>

                  <div className="feature-item">
                    <MapPin className="feature-icon" size={20} />
                    <div className="feature-content">
                      <span className="feature-label">Tầm hoạt động</span>
                      <span className="feature-value">{vehicle.range} km</span>
                    </div>
                  </div>

                  {vehicle.battery_level && (
                    <div className="feature-item">
                      <Battery className="feature-icon" size={20} />
                      <div className="feature-content">
                        <span className="feature-label">Mức pin hiện tại</span>
                        <div className="battery-display">
                          <div className="battery-bar">
                            <div 
                              className={`battery-fill battery-fill--${getBatteryColor()}`}
                              style={{ width: `${vehicle.battery_level}%` }}
                            />
                          </div>
                          <span className={`battery-value battery-value--${getBatteryColor()}`}>
                            {vehicle.battery_level}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {vehicle.color && (
                    <div className="feature-item">
                      <div className="color-swatch" style={{ backgroundColor: vehicle.color }} />
                      <div className="feature-content">
                        <span className="feature-label">Màu sắc</span>
                        <span className="feature-value">{vehicle.color}</span>
                      </div>
                    </div>
                  )}

                  <div className="feature-item">
                    <Car className="feature-icon" size={20} />
                    <div className="feature-content">
                      <span className="feature-label">Nhà sản xuất</span>
                      <span className="feature-value">{vehicle.name.split(' ')[0]}</span>
                    </div>
                  </div>

                  <div className="feature-item">
                    <Car className="feature-icon" size={20} />
                    <div className="feature-content">
                      <span className="feature-label">Mô tả</span>
                      <span className="feature-value">Xe điện thân thiện môi trường</span>
                    </div>
                  </div>
                </div>

                {/* Specifications */}
                <div className="vehicle-detail__specs">
                  <h4 className="specs-title">Thông số kỹ thuật</h4>
                  <div className="specs-content">
                    <div className="spec-item">
                      <span className="spec-label">Loại động cơ:</span>
                      <span className="spec-value">Điện</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Tốc độ tối đa:</span>
                      <span className="spec-value">140 km/h</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Thời gian sạc:</span>
                      <span className="spec-value">8 giờ (sạc chậm)</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Số chỗ ngồi:</span>
                      <span className="spec-value">5 chỗ</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Trọng lượng:</span>
                      <span className="spec-value">1,500 kg</span>
                    </div>
                    <div className="spec-item">
                      <span className="spec-label">Kích thước:</span>
                      <span className="spec-value">4.4m x 1.8m x 1.5m</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="vehicle-detail__price">
                <span className="price-label">Giá thuê</span>
                <div className="price-amount">
                  <span className="price-number">{vehicle.price_per_hour.toLocaleString('vi-VN')}</span>
                  <span className="price-unit">VNĐ/giờ</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="vehicle-detail__actions">
                {userRole === 'customer' ? (
                  <button
                    className={`btn btn--primary btn--large ${!canRent ? 'btn--disabled' : ''}`}
                    onClick={() => setIsBookingModalOpen(true)}
                    disabled={!canRent}
                  >
                    {canRent ? 'Đặt xe ngay' : 'Không khả dụng'}
                  </button>
                ) : (
                  <button
                    className="btn btn--secondary btn--large"
                    onClick={() => onRentVehicle(vehicle)}
                  >
                    Xem chi tiết
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="vehicle-detail__bottom">
          {/* Left - Related Vehicles */}
          <div className="vehicle-detail__related">
            <h3 className="section-title">Mẫu xe khác</h3>
            <div className="related-vehicles-grid">
              {relatedVehicles.map((relatedVehicle) => (
                <div key={relatedVehicle.vehicle_id} className="related-vehicle-card">
                  <NewVehicleCard
                    vehicle={relatedVehicle}
                    onRentVehicle={onRentVehicle}
                    userRole={userRole}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Right - Rental Conditions */}
          <div className="vehicle-detail__conditions">
            <h3 className="section-title">Điều kiện thuê xe</h3>
            <div className="conditions-list">
              <div className="condition-item">
                <Shield className="condition-icon" size={20} />
                <div className="condition-content">
                  <h4>Bảo hiểm</h4>
                  <p>Xe được bảo hiểm toàn diện trong suốt thời gian thuê</p>
                </div>
              </div>

              <div className="condition-item">
                <Clock className="condition-icon" size={20} />
                <div className="condition-content">
                  <h4>Thời gian thuê</h4>
                  <p>Tối thiểu 1 giờ, tối đa 7 ngày liên tục</p>
                </div>
              </div>

              <div className="condition-item">
                <CheckCircle className="condition-icon" size={20} />
                <div className="condition-content">
                  <h4>Yêu cầu</h4>
                  <p>Bằng lái xe hợp lệ và thẻ căn cước công dân</p>
                </div>
              </div>

              <div className="condition-item">
                <Star className="condition-icon" size={20} />
                <div className="condition-content">
                  <h4>Hỗ trợ</h4>
                  <p>Hỗ trợ 24/7 qua hotline và ứng dụng</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {vehicle && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          vehicle={vehicle}
          onConfirmBooking={handleBookingConfirm}
        />
      )}
    </div>
  );
};

export default VehicleDetail;
