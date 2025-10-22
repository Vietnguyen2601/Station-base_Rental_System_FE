import React from 'react';
import { Battery, Zap, MapPin, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { VehicleCardProps } from '../../types';
import './VehicleCard.scss';

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onRentVehicle, userRole }) => {
  const getBatteryColor = () => {
    if (vehicle.batteryLevel > 70) return 'success';
    if (vehicle.batteryLevel > 30) return 'warning';
    return 'error';
  };

  const getStatusColor = () => {
    switch (vehicle.status) {
      case 'available':
        return 'success';
      case 'charging':
        return 'info';
      case 'rented':
        return 'warning';
      case 'maintenance':
        return 'error';
      default:
        return 'error';
    }
  };

  const getStatusText = () => {
    switch (vehicle.status) {
      case 'available':
        return 'Có sẵn';
      case 'charging':
        return 'Đang sạc';
      case 'rented':
        return 'Đang thuê';
      case 'maintenance':
        return 'Bảo trì';
      default:
        return 'Không rõ';
    }
  };

  const getStatusIcon = () => {
    switch (vehicle.status) {
      case 'available':
        return <CheckCircle size={14} />;
      case 'charging':
        return <Zap size={14} />;
      case 'rented':
        return <Clock size={14} />;
      case 'maintenance':
        return <AlertCircle size={14} />;
      default:
        return <AlertCircle size={14} />;
    }
  };

  const canRent = vehicle.status === 'available' && vehicle.batteryLevel > 20;

  return (
    <div className="vehicle-card">
      <div className="vehicle-card__image-wrapper">
        {vehicle.imageUrl ? (
          <img src={vehicle.imageUrl} alt={vehicle.name} className="vehicle-card__image" />
        ) : (
          <div className="vehicle-card__image-placeholder">
            <Zap size={48} />
          </div>
        )}
        <div className={`vehicle-card__status-badge vehicle-card__status-badge--${getStatusColor()}`}>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
      </div>

      <div className="vehicle-card__content">
        <div className="vehicle-card__header">
          <h3 className="vehicle-card__title">{vehicle.name}</h3>
          <p className="vehicle-card__model">{vehicle.model}</p>
        </div>

        <div className="vehicle-card__details">
          {/* Battery Level */}
          <div className="vehicle-card__detail">
            <div className="vehicle-card__detail-header">
              <Battery size={16} className="vehicle-card__detail-icon" />
              <span className="vehicle-card__detail-label">Mức pin</span>
            </div>
            <div className="vehicle-card__battery-bar-wrapper">
              <div className="vehicle-card__battery-bar">
                <div 
                  className={`vehicle-card__battery-fill vehicle-card__battery-fill--${getBatteryColor()}`}
                  style={{ width: `${vehicle.batteryLevel}%` }}
                />
              </div>
              <span className={`vehicle-card__battery-value vehicle-card__battery-value--${getBatteryColor()}`}>
                {vehicle.batteryLevel}%
              </span>
            </div>
          </div>

          {/* Location */}
          <div className="vehicle-card__detail">
            <div className="vehicle-card__detail-header">
              <MapPin size={16} className="vehicle-card__detail-icon" />
              <span className="vehicle-card__detail-label">Vị trí</span>
            </div>
            <span className="vehicle-card__detail-value">{vehicle.location}</span>
          </div>

          {/* Price */}
          <div className="vehicle-card__detail vehicle-card__detail--price">
            <div className="vehicle-card__price">
              <span className="vehicle-card__price-amount">{vehicle.pricePerHour.toLocaleString('vi-VN')}đ</span>
              <span className="vehicle-card__price-unit">/giờ</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="vehicle-card__actions">
          {(userRole === 'customer' || !userRole) && (
            <button
              onClick={() => onRentVehicle(vehicle)}
              className={`vehicle-card__btn ${canRent ? 'vehicle-card__btn--primary' : 'vehicle-card__btn--disabled'}`}
              disabled={!canRent}
            >
              {canRent ? 'Thuê ngay' : 'Không khả dụng'}
            </button>
          )}

          {userRole === 'staff' && (
            <button className="vehicle-card__btn vehicle-card__btn--secondary">
              Quản lý
            </button>
          )}

          {userRole === 'admin' && (
            <button className="vehicle-card__btn vehicle-card__btn--secondary">
              Chỉnh sửa
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;