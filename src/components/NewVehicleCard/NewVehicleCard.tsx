import React from 'react';
import { Battery, Zap, MapPin, CheckCircle, AlertCircle, Clock, Car } from 'lucide-react';
import { NewVehicleCardProps } from '../../types';
import './NewVehicleCard.scss';

const NewVehicleCard: React.FC<NewVehicleCardProps> = ({ vehicle, onRentVehicle, onViewDetail, userRole }) => {
  const getBatteryColor = () => {
    if (!vehicle.battery_level) return 'error';
    if (vehicle.battery_level > 70) return 'success';
    if (vehicle.battery_level > 30) return 'warning';
    return 'error';
  };

  const getStatusColor = () => {
    switch (vehicle.status) {
      case 'AVAILABLE':
        return 'success';
      case 'CHARGING':
        return 'info';
      case 'RENTED':
        return 'warning';
      case 'MAINTENANCE':
        return 'error';
      default:
        return 'error';
    }
  };

  const getStatusText = () => {
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

  const getStatusIcon = () => {
    switch (vehicle.status) {
      case 'AVAILABLE':
        return <CheckCircle size={14} />;
      case 'CHARGING':
        return <Zap size={14} />;
      case 'RENTED':
        return <Clock size={14} />;
      case 'MAINTENANCE':
        return <AlertCircle size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const canRent = vehicle.status === 'AVAILABLE' && (vehicle.battery_level || 0) > 20;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger if clicking on the action button
    if ((e.target as HTMLElement).closest('.new-vehicle-card__actions')) {
      return;
    }
    
    console.log('NewVehicleCard handleCardClick called');
    console.log('onViewDetail prop:', onViewDetail);
    console.log('vehicle:', vehicle);
    if (onViewDetail) {
      console.log('Calling onViewDetail with vehicle:', vehicle);
      onViewDetail(vehicle);
    } else {
      console.log('onViewDetail is not provided');
    }
  };

  return (
    <div className="new-vehicle-card fade-in" onClick={handleCardClick} style={{ cursor: onViewDetail ? 'pointer' : 'default' }}>
      {/* Click hint for view detail */}
      {onViewDetail && (
        <div className="new-vehicle-card__click-hint">
          <span>Click để xem chi tiết</span>
        </div>
      )}
      
      {/* Image Section */}
      <div className="new-vehicle-card__image-wrapper">
        {vehicle.img ? (
          <img 
            src={vehicle.img} 
            alt={vehicle.name}
            className="new-vehicle-card__image"
          />
        ) : (
          <div className="new-vehicle-card__image-placeholder">
            <Car size={48} />
          </div>
        )}
        
        {/* Status Badge */}
        <div className={`new-vehicle-card__status-badge new-vehicle-card__status-badge--${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>

      {/* Content Section */}
      <div className="new-vehicle-card__content">
        {/* Header */}
        <div className="new-vehicle-card__header">
          <h3 className="new-vehicle-card__title">{vehicle.name}</h3>
          <p className="new-vehicle-card__type">{vehicle.type_name}</p>
        </div>

        {/* Details */}
        <div className="new-vehicle-card__details">
          {/* Battery Capacity */}
          <div className="new-vehicle-card__detail">
            <div className="new-vehicle-card__detail-header">
              <Battery className="new-vehicle-card__detail-icon" size={16} />
              <span className="new-vehicle-card__detail-label">Dung lượng pin</span>
            </div>
            <span className="new-vehicle-card__detail-value">
              {vehicle.battery_capacity} kWh
            </span>
          </div>

          {/* Range */}
          <div className="new-vehicle-card__detail">
            <div className="new-vehicle-card__detail-header">
              <MapPin className="new-vehicle-card__detail-icon" size={16} />
              <span className="new-vehicle-card__detail-label">Tầm hoạt động</span>
            </div>
            <span className="new-vehicle-card__detail-value">
              {vehicle.range} km
            </span>
          </div>

          {/* Battery Level (if available) */}
          {vehicle.battery_level && (
            <div className="new-vehicle-card__detail">
              <div className="new-vehicle-card__detail-header">
                <Battery className="new-vehicle-card__detail-icon" size={16} />
                <span className="new-vehicle-card__detail-label">Mức pin hiện tại</span>
              </div>
              <div className="new-vehicle-card__battery-bar-wrapper">
                <div className="new-vehicle-card__battery-bar">
                  <div 
                    className={`new-vehicle-card__battery-fill new-vehicle-card__battery-fill--${getBatteryColor()}`}
                    style={{ width: `${vehicle.battery_level}%` }}
                  />
                </div>
                <span className={`new-vehicle-card__battery-value new-vehicle-card__battery-value--${getBatteryColor()}`}>
                  {vehicle.battery_level}%
                </span>
              </div>
            </div>
          )}

          {/* Price */}
          <div className="new-vehicle-card__detail new-vehicle-card__detail--price">
            <div className="new-vehicle-card__detail-header">
              <span className="new-vehicle-card__detail-label">Giá thuê</span>
            </div>
            <div className="new-vehicle-card__price">
              <span className="new-vehicle-card__price-amount">
                {vehicle.price_per_hour.toLocaleString('vi-VN')}
              </span>
              <span className="new-vehicle-card__price-unit">VNĐ/giờ</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="new-vehicle-card__actions">
          {userRole === 'customer' ? (
            <button
              className={`new-vehicle-card__btn ${
                canRent 
                  ? 'new-vehicle-card__btn--primary' 
                  : 'new-vehicle-card__btn--disabled'
              }`}
              onClick={() => canRent && onRentVehicle(vehicle)}
              disabled={!canRent}
            >
              {canRent ? 'Thuê ngay' : 'Không khả dụng'}
            </button>
          ) : (
            <button
              className="new-vehicle-card__btn new-vehicle-card__btn--secondary"
              onClick={() => onRentVehicle(vehicle)}
            >
              Xem chi tiết
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewVehicleCard;
