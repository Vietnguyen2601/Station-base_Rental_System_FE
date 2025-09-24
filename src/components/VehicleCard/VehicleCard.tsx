import React from 'react';
import { Battery, Car, Clock, DollarSign, MapPin } from 'lucide-react';
import { VehicleCardProps } from '../../types';
import './VehicleCard.scss';

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle, onRentVehicle, userRole }) => {
  const getBatteryColor = () => {
    if (vehicle.batteryLevel > 60) return 'success';
    if (vehicle.batteryLevel > 30) return 'warning';
    return 'error';
  };

  const getStatusColor = () => {
    switch (vehicle.status) {
      case 'available':
        return 'success';
      case 'charging':
        return 'warning';
      case 'rented':
        return 'error';
      case 'maintenance':
        return 'error';
      default:
        return 'error';
    }
  };

  const getStatusText = () => {
    switch (vehicle.status) {
      case 'available':
        return 'Available';
      case 'charging':
        return 'Charging';
      case 'rented':
        return 'Rented';
      case 'maintenance':
        return 'Maintenance';
      default:
        return 'Unknown';
    }
  };

  const canRent = vehicle.status === 'available' && vehicle.batteryLevel > 20;

  return (
    <div className="vehicle-card fade-in">
      {vehicle.imageUrl && (
        <div className="vehicle-card__image">
          <img src={vehicle.imageUrl} alt={vehicle.name} />
        </div>
      )}

      <div className="vehicle-card__content">
        <div className="vehicle-card__header">
          <div className="vehicle-card__title-section">
            <h3 className="vehicle-card__title">{vehicle.name}</h3>
            <span className="vehicle-card__model">{vehicle.model}</span>
          </div>
          <div className={`vehicle-card__status vehicle-card__status--${getStatusColor()}`}>
            {getStatusText()}
          </div>
        </div>

        <div className="vehicle-card__stats">
          <div className="vehicle-card__stat">
            <Battery className="vehicle-card__stat-icon" />
            <div className="vehicle-card__stat-content">
              <span className="vehicle-card__stat-label">Battery</span>
              <div className="vehicle-card__battery">
                <div 
                  className={`vehicle-card__battery-bar vehicle-card__battery-bar--${getBatteryColor()}`}
                  style={{ width: `${vehicle.batteryLevel}%` }}
                />
                <span className={`vehicle-card__battery-text vehicle-card__battery-text--${getBatteryColor()}`}>
                  {vehicle.batteryLevel}%
                </span>
              </div>
            </div>
          </div>

          <div className="vehicle-card__stat">
            <MapPin className="vehicle-card__stat-icon" />
            <div className="vehicle-card__stat-content">
              <span className="vehicle-card__stat-label">Location</span>
              <span className="vehicle-card__stat-value">{vehicle.location}</span>
            </div>
          </div>

          <div className="vehicle-card__stat">
            <DollarSign className="vehicle-card__stat-icon" />
            <div className="vehicle-card__stat-content">
              <span className="vehicle-card__stat-label">Rate</span>
              <span className="vehicle-card__stat-value">
                ${vehicle.pricePerHour}/hour
              </span>
            </div>
          </div>
        </div>

        <div className="vehicle-card__actions">
          {userRole === 'renter' && (
            <button
              onClick={() => onRentVehicle(vehicle)}
              className="btn btn-primary vehicle-card__rent-btn"
              disabled={!canRent}
            >
              {canRent ? 'Rent Now' : 'Not Available'}
            </button>
          )}

          {userRole === 'staff' && (
            <div className="vehicle-card__staff-actions">
              <button className="btn btn-secondary vehicle-card__manage-btn">
                Manage
              </button>
              <button className="btn btn-outline vehicle-card__details-btn">
                Details
              </button>
            </div>
          )}

          {userRole === 'admin' && (
            <div className="vehicle-card__admin-actions">
              <button className="btn btn-secondary vehicle-card__edit-btn">
                Edit
              </button>
              <button className="btn btn-outline vehicle-card__analytics-btn">
                Analytics
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleCard;