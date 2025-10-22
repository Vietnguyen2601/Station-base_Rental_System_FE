import React, { useState, useMemo } from 'react';
import { 
  Car, 
  Battery, 
  MapPin, 
  Wrench, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { 
  mockVehicles, 
  mockVehicleModels, 
  mockVehicleTypes,
  getVehicleWithDetails,
  getVehiclesByStation 
} from '../../utils/vehicleMockData';
import VehicleManagementModal from '../../components/VehicleManagementModal/VehicleManagementModal';
import { Vehicle } from '../../types';
import './StaffVehicleManagement.scss';

const StaffVehicleManagement: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<Vehicle['status'] | 'ALL'>('ALL');
  const [selectedStation, setSelectedStation] = useState('1'); // Staff assigned to station 1
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Get vehicles assigned to this staff's station
  const staffVehicles = useMemo(() => {
    return getVehiclesByStation(selectedStation);
  }, [selectedStation]);

  // Filter vehicles based on search and status
  const filteredVehicles = useMemo(() => {
    let filtered = staffVehicles;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(vehicle => vehicle.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(vehicle => {
        const model = mockVehicleModels.find(m => m.vehicle_model_id === vehicle.model_id);
        const type = model ? mockVehicleTypes.find(t => t.type_id === model.type_id) : null;
        
        return (
          vehicle.serial_number.toLowerCase().includes(query) ||
          model?.name.toLowerCase().includes(query) ||
          model?.manufacturer.toLowerCase().includes(query) ||
          vehicle.color?.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  }, [staffVehicles, statusFilter, searchQuery]);

  const getStatusIcon = (status: Vehicle['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle size={16} className="status-icon status-icon--available" />;
      case 'RENTED':
        return <Car size={16} className="status-icon status-icon--rented" />;
      case 'CHARGING':
        return <Zap size={16} className="status-icon status-icon--charging" />;
      case 'MAINTENANCE':
        return <Wrench size={16} className="status-icon status-icon--maintenance" />;
      default:
        return <AlertCircle size={16} className="status-icon" />;
    }
  };

  const getStatusText = (status: Vehicle['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Có sẵn';
      case 'RENTED':
        return 'Đang thuê';
      case 'CHARGING':
        return 'Đang sạc';
      case 'MAINTENANCE':
        return 'Bảo trì';
      default:
        return status;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 70) return 'success';
    if (level > 30) return 'warning';
    return 'error';
  };

  const stats = useMemo(() => {
    const total = staffVehicles.length;
    const available = staffVehicles.filter(v => v.status === 'AVAILABLE').length;
    const rented = staffVehicles.filter(v => v.status === 'RENTED').length;
    const charging = staffVehicles.filter(v => v.status === 'CHARGING').length;
    const maintenance = staffVehicles.filter(v => v.status === 'MAINTENANCE').length;

    return { total, available, rented, charging, maintenance };
  }, [staffVehicles]);

  return (
    <div className="staff-vehicle-management">
      <div className="staff-vehicle-management__header">
        <div className="staff-vehicle-management__title">
          <h2>Quản lý xe</h2>
          <p>Quản lý xe tại trạm được phân công</p>
        </div>
        <button className="staff-vehicle-management__add-btn">
          <Plus size={20} />
          Thêm xe mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="staff-vehicle-management__stats">
        <div className="stat-card stat-card--total">
          <div className="stat-card__icon">
            <Car size={24} />
          </div>
          <div className="stat-card__content">
            <h3>{stats.total}</h3>
            <p>Tổng số xe</p>
          </div>
        </div>
        <div className="stat-card stat-card--available">
          <div className="stat-card__icon">
            <CheckCircle size={24} />
          </div>
          <div className="stat-card__content">
            <h3>{stats.available}</h3>
            <p>Có sẵn</p>
          </div>
        </div>
        <div className="stat-card stat-card--rented">
          <div className="stat-card__icon">
            <Car size={24} />
          </div>
          <div className="stat-card__content">
            <h3>{stats.rented}</h3>
            <p>Đang thuê</p>
          </div>
        </div>
        <div className="stat-card stat-card--charging">
          <div className="stat-card__icon">
            <Zap size={24} />
          </div>
          <div className="stat-card__content">
            <h3>{stats.charging}</h3>
            <p>Đang sạc</p>
          </div>
        </div>
        <div className="stat-card stat-card--maintenance">
          <div className="stat-card__icon">
            <Wrench size={24} />
          </div>
          <div className="stat-card__content">
            <h3>{stats.maintenance}</h3>
            <p>Bảo trì</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="staff-vehicle-management__filters">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo số serial, model, hãng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-box">
          <Filter size={20} />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Vehicle['status'] | 'ALL')}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="AVAILABLE">Có sẵn</option>
            <option value="RENTED">Đang được thuê</option>
            <option value="MAINTENANCE">Bảo trì</option>
          </select>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="staff-vehicle-management__content">
        <div className="vehicle-grid">
          {filteredVehicles.map((vehicle) => {
            const model = mockVehicleModels.find(m => m.vehicle_model_id === vehicle.model_id);
            const type = model ? mockVehicleTypes.find(t => t.type_id === model.type_id) : null;
            
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
                </div>

                <div className="vehicle-card__actions">
                  <button 
                    className="action-btn action-btn--view"
                    onClick={() => setIsModalOpen(true)}
                  >
                    <Eye size={16} />
                    Xem chi tiết
                  </button>
                  <button className="action-btn action-btn--edit">
                    <Edit size={16} />
                    Sửa
                  </button>
                  <button className="action-btn action-btn--delete">
                    <Trash2 size={16} />
                    Xóa
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredVehicles.length === 0 && (
          <div className="empty-state">
            <Car size={48} />
            <h3>Không tìm thấy xe nào</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        )}
      </div>

      {/* Vehicle Management Modal */}
      <VehicleManagementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicles={staffVehicles}
        vehicleModels={mockVehicleModels}
        vehicleTypes={mockVehicleTypes}
        stationName={`Trạm ${selectedStation}`}
      />
    </div>
  );
};

export default StaffVehicleManagement;
