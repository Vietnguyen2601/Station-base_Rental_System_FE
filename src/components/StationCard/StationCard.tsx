import React from 'react';
import { MapPin, Car, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { StationCardProps } from '../../types';
import './StationCard.scss';

const StationCard: React.FC<StationCardProps> = ({ station, onSelectStation }) => {
  const getStatusIcon = () => {
    switch (station.status) {
      case 'active':
        return <CheckCircle className="station-card__status-icon station-card__status-icon--active" />;
      case 'maintenance':
        return <AlertCircle className="station-card__status-icon station-card__status-icon--warning" />;
      case 'inactive':
        return <XCircle className="station-card__status-icon station-card__status-icon--error" />;
      default:
        return null;
    }
  };

  const getAvailabilityColor = () => {
    const percentage = (station.availableVehicles / station.totalVehicles) * 100;
    if (percentage > 50) return 'success';
    if (percentage > 20) return 'warning';
    return 'error';
  };

  return (
    <div className="station-card fade-in">
      <div className="station-card__header">
        <div className="station-card__title-section">
          <h3 className="station-card__title">{station.name}</h3>
          {getStatusIcon()}
        </div>
        <div className="station-card__location">
          <MapPin className="station-card__location-icon" />
          <span className="station-card__address">{station.address}</span>
        </div>
      </div>

      <div className="station-card__stats">
        <div className="station-card__stat">
          <Car className="station-card__stat-icon" />
          <div className="station-card__stat-content">
            <span className="station-card__stat-label">Available</span>
            <span className={`station-card__stat-value station-card__stat-value--${getAvailabilityColor()}`}>
              {station.availableVehicles}/{station.totalVehicles}
            </span>
          </div>
        </div>

        <div className="station-card__stat">
          <Clock className="station-card__stat-icon" />
          <div className="station-card__stat-content">
            <span className="station-card__stat-label">Status</span>
            <span className={`station-card__stat-value station-card__stat-value--${station.status === 'active' ? 'success' : station.status === 'maintenance' ? 'warning' : 'error'}`}>
              {station.status}
            </span>
          </div>
        </div>
      </div>

      <div className="station-card__facilities">
        <h4 className="station-card__facilities-title">Facilities</h4>
        <div className="station-card__facilities-list">
          {station.facilities.map((facility, index) => (
            <span key={index} className="station-card__facility-tag">
              {facility}
            </span>
          ))}
        </div>
      </div>

      {onSelectStation && (
        <div className="station-card__actions">
          <button
            onClick={() => onSelectStation(station)}
            className="btn btn-primary station-card__select-btn"
            disabled={station.status !== 'active' || station.availableVehicles === 0}
          >
            {station.availableVehicles === 0 ? 'No Vehicles Available' : 'Select Station'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StationCard;