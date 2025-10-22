import React from 'react';
import { X, Car, Battery, MapPin, Wrench, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { Vehicle, VehicleModel, VehicleType } from '../../types';
import './VehicleManagementModal.scss';

interface VehicleManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  vehicleModels: VehicleModel[];
  vehicleTypes: VehicleType[];
  stationName: string;
}

const VehicleManagementModal: React.FC<VehicleManagementModalProps> = ({
  isOpen,
  onClose,
  vehicles,
  vehicleModels,
  vehicleTypes,
  stationName
}) => {
  if (!isOpen) return null;

  const getStatusIcon = (status: Vehicle['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle size={16} className="status-icon status-icon--available" />;
      case 'RENTED':
        return <Car size={16} className="status-icon status-icon--rented" />;
      case 'MAINTENANCE':
        return <Wrench size={16} className="status-icon status-icon--maintenance" />;
      case 'CHARGING':
        return <Zap size={16} className="status-icon status-icon--charging" />;
      default:
        return <AlertCircle size={16} className="status-icon" />;
    }
  };

  const getStatusText = (status: Vehicle['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Có sẵn';
      case 'RENTED':
        return 'Đang được thuê';
      case 'MAINTENANCE':
        return 'Bảo trì';
      case 'CHARGING':
        return 'Đang sạc';
      default:
        return status;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 70) return 'success';
    if (level > 30) return 'warning';
    return 'error';
  };

  const getVehicleWithDetails = (vehicle: Vehicle) => {
    const model = vehicleModels.find(m => m.vehicle_model_id === vehicle.model_id);
    const type = model ? vehicleTypes.find(t => t.type_id === model.type_id) : null;
    return { vehicle, model, type };
  };

  const stats = {
    total: vehicles.length,
    available: vehicles.filter(v => v.status === 'AVAILABLE').length,
    rented: vehicles.filter(v => v.status === 'RENTED').length,
    maintenance: vehicles.filter(v => v.status === 'MAINTENANCE').length,
    charging: vehicles.filter(v => v.status === 'CHARGING').length,
  };

  return (
    <div className="vehicle-modal-overlay" onClick={onClose}>
      <div className="vehicle-modal" onClick={(e) => e.stopPropagation()}>
        <div className="vehicle-modal__header">
          <div className="vehicle-modal__title">
            <h2>Quản lý xe - {stationName}</h2>
            <p>Tổng số xe: {stats.total}</p>
          </div>
          <button className="vehicle-modal__close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Stats */}
        <div className="vehicle-modal__stats">
          <div className="stat-item stat-item--available">
            <CheckCircle size={20} />
            <span>{stats.available} Có sẵn</span>
          </div>
          <div className="stat-item stat-item--rented">
            <Car size={20} />
            <span>{stats.rented} Đang thuê</span>
          </div>
          <div className="stat-item stat-item--maintenance">
            <Wrench size={20} />
            <span>{stats.maintenance} Bảo trì</span>
          </div>
          <div className="stat-item stat-item--charging">
            <Zap size={20} />
            <span>{stats.charging} Đang sạc</span>
          </div>
        </div>

        {/* Vehicle List */}
        <div className="vehicle-modal__content">
          <div className="vehicle-grid">
            {vehicles.map((vehicle) => {
              const { model, type } = getVehicleWithDetails(vehicle);
              
              return (
                <div key={vehicle.vehicle_id} className="vehicle-card">
                  <div className="vehicle-card__header">
                    <div className="vehicle-card__image">
                      {vehicle.img ? (
                        <img src={vehicle.img} alt={model?.name} />
                      ) : (
                        <Car size={40} />
                      )}
                    </div>
                    <div className="vehicle-card__status">
                      {getStatusIcon(vehicle.status)}
                      <span>{getStatusText(vehicle.status)}</span>
                    </div>
                  </div>

                  <div className="vehicle-card__content">
                    <h3 className="vehicle-card__title">
                      {model?.manufacturer} {model?.name}
                    </h3>
                    <p className="vehicle-card__serial">{vehicle.serial_number}</p>
                    <p className="vehicle-card__type">{type?.type_name}</p>
                    
                    <div className="vehicle-card__details">
                      <div className="detail-item">
                        <Battery size={16} />
                        <span className={`battery-level battery-level--${getBatteryColor(vehicle.battery_level || 0)}`}>
                          {vehicle.battery_level}%
                        </span>
                      </div>
                      <div className="detail-item">
                        <MapPin size={16} />
                        <span>{vehicle.range}km</span>
                      </div>
                      <div className="detail-item">
                        <span className="color-indicator" style={{ backgroundColor: vehicle.color?.toLowerCase() }}></span>
                        <span>{vehicle.color}</span>
                      </div>
                    </div>

                    {vehicle.last_maintenance && (
                      <div className="vehicle-card__maintenance">
                        <Wrench size={14} />
                        <span>Bảo trì: {new Date(vehicle.last_maintenance).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}

                    <div className="vehicle-card__price">
                      <span className="price-label">Giá thuê:</span>
                      <span className="price-value">{model?.price_per_hour.toLocaleString('vi-VN')}đ/giờ</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {vehicles.length === 0 && (
            <div className="empty-state">
              <Car size={48} />
              <h3>Không có xe nào</h3>
              <p>Trạm này chưa có xe được phân công</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleManagementModal;
