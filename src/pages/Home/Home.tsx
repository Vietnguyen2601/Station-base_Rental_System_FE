import React, { useEffect, useMemo, useState } from 'react';
import { Search, MapPin, Battery, Clock, TrendingUp, XCircle, Shield, Gauge, Car } from 'lucide-react';
import NewVehicleCard from '../../components/NewVehicleCard/NewVehicleCard';
import Navbar from '../../components/Navbar/Navbar';
import CloudinaryImage from '../../components/common/CloudinaryImage/CloudinaryImage';
import { vehicleService, VehicleModel, VehicleType } from '../../services/vehicleService';
import { mockVehicleModels, mockVehicleTypes } from '../../utils/vehicleMockData';
import { User, NewVehicleCardData } from '../../types';
import './Home.scss';

interface EnhancedVehicleCardData extends NewVehicleCardData {
  modelId?: string;
}
interface HomeProps {
  user?: User;
  onLogin?: () => void;
  onRegister?: () => void;
  onViewVehicleDetail?: (vehicle: NewVehicleCardData) => void;
}

const Home: React.FC<HomeProps> = ({ user, onLogin, onRegister, onViewVehicleDetail }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicles, setVehicles] = useState<EnhancedVehicleCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<EnhancedVehicleCardData | null>(null);

  const convertApiModel = (
    model: VehicleModel,
    type?: VehicleType
  ): EnhancedVehicleCardData => ({
    vehicle_id: model.vehicleModelId,
    modelId: model.vehicleModelId,
    name: `${model.manufacturer} ${model.name}`.trim(),
    modelName: model.name,
    manufacturer: model.manufacturer,
    price_per_hour: model.pricePerHour ?? 0,
    battery_capacity: 0,
    range: 0,
    type_name: type?.typeName ?? 'Đang cập nhật',
    typeId: type?.vehicleTypeId,
    typeDescription: type?.description,
    status: 'AVAILABLE',
    img: undefined,
    battery_level: undefined,
    color: undefined,
    entityType: 'model',
    specs: model.specs,
  });

  const convertMockModel = (
    model: (typeof mockVehicleModels)[number],
    type?: (typeof mockVehicleTypes)[number]
  ): EnhancedVehicleCardData => ({
    vehicle_id: model.vehicle_model_id,
    modelId: model.vehicle_model_id,
    name: `${model.manufacturer} ${model.name}`.trim(),
    modelName: model.name,
    manufacturer: model.manufacturer,
    price_per_hour: model.price_per_hour ?? 0,
    battery_capacity: 0,
    range: 0,
    type_name: type?.type_name ?? 'Đang cập nhật',
    typeId: type?.vehicle_type_id,
    typeDescription: type?.description,
    status: 'AVAILABLE',
    img: undefined,
    battery_level: undefined,
    color: undefined,
    entityType: 'model',
    specs: model.specs,
  });

  useEffect(() => {
    let mounted = true;

    const fetchVehicleCatalog = async () => {
      try {
        setIsLoading(true);
        const [models, types] = await Promise.all([
          vehicleService.getVehicleModels(),
          vehicleService.getVehicleTypes(),
        ]);

        if (!mounted) {
          return;
        }

        const activeTypes = types.filter((type) => type.isactive);
        const typeMap = new Map(activeTypes.map((type) => [type.vehicleTypeId, type]));

        const preparedVehicles = models
          .filter((model) => model.isactive)
          .map((model) => convertApiModel(model, typeMap.get(model.typeId)));

        setVehicles(preparedVehicles);
      } catch (error) {
        console.error('Error fetching vehicle catalog for Home page:', error);
        if (!mounted) {
          return;
        }

        const typeMap = new Map(
          mockVehicleTypes
            .filter((type) => type.isActive)
            .map((type) => [type.vehicle_type_id, type])
        );

        const fallback = mockVehicleModels
          .filter((model) => model.isActive)
          .map((model) => convertMockModel(model, typeMap.get(model.type_id)));

  setVehicles(fallback);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchVehicleCatalog();

    return () => {
      mounted = false;
    };
  }, []);

  const totalModels = vehicles.length;

  const availableModels = useMemo(
    () => vehicles.filter((vehicle) => vehicle.status === 'AVAILABLE').length,
    [vehicles]
  );

  const typeCount = useMemo(() => {
    const typeNames = vehicles
      .map((vehicle) => vehicle.type_name)
      .filter((name): name is string => Boolean(name));
    return new Set(typeNames).size;
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return vehicles;
    }

    return vehicles.filter((vehicle) => {
      const modelMatch = vehicle.modelName
        ? vehicle.modelName.toLowerCase().includes(query)
        : false;
      const manufacturerMatch = vehicle.manufacturer
        ? vehicle.manufacturer.toLowerCase().includes(query)
        : false;
      const compositeMatch = vehicle.name.toLowerCase().includes(query);
      const typeMatch = vehicle.type_name
        ? vehicle.type_name.toLowerCase().includes(query)
        : false;
      return modelMatch || manufacturerMatch || compositeMatch || typeMatch;
    });
  }, [vehicles, searchQuery]);

  const handleRentVehicle = (vehicle: NewVehicleCardData) => {
    alert(`Rental process started for ${vehicle.name}`);
  };

  const handleCardView = (vehicle: NewVehicleCardData) => {
    setSelectedVehicle(vehicle as EnhancedVehicleCardData);
    onViewVehicleDetail?.(vehicle);
  };

  const getStatusLabel = (status: NewVehicleCardData['status']) => {
    switch (status) {
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

  const getBatteryVariant = (level?: number) => {
    if (level === undefined || level === null) {
      return 'warning';
    }
    if (level > 70) {
      return 'success';
    }
    if (level > 30) {
      return 'warning';
    }
    return 'error';
  };

  const formatMetricWithUnit = (value?: number, unit?: string) => {
    if (!value || value <= 0) {
      return 'Đang cập nhật';
    }
    return unit ? `${value} ${unit}` : `${value}`;
  };


  return (
    <div className="home">
      {!user && onLogin && onRegister && (
        <Navbar onLogin={onLogin} onRegister={onRegister} />
      )}

      <section className="home__hero">
        <div className="container">
          <div className="home__hero-content">
            <h1 className="home__hero-title">
              Sustainable Mobility at Your Fingertips
            </h1>
            <p className="home__hero-subtitle">
              Rent electric vehicles from convenient station locations across the city.
              Clean, efficient, and available 24/7.
            </p>

            <div className="home__search">
              <div className="home__search-input">
                <Search className="home__search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm mẫu xe hoặc hãng..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="home__search-field"
                />
              </div>
            </div>

            <div className="home__stats">
              <div className="home__stat">
                <Battery className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">{availableModels}</span>
                  <span className="home__stat-label">Mẫu xe sẵn sàng</span>
                </div>
              </div>
              <div className="home__stat">
                <TrendingUp className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">{totalModels}</span>
                  <span className="home__stat-label">Tổng mẫu xe</span>
                </div>
              </div>
              <div className="home__stat">
                <Clock className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">24/7</span>
                  <span className="home__stat-label">Giờ phục vụ</span>
                </div>
              </div>
              <div className="home__stat">
                <MapPin className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">{typeCount}</span>
                  <span className="home__stat-label">Phân khúc</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home__content">
        <div className="container">
          {user && user.role === 'customer' && (
            <div className="home__section">
              <h2 className="home__section-title">Tìm xe hoàn hảo</h2>
              <p className="home__section-subtitle">
                Duyệt qua các xe có sẵn và chọn trạm phù hợp
              </p>
            </div>
          )}

          {user && user.role === 'staff' && (
            <div className="home__section">
              <h2 className="home__section-title">Bảng điều khiển quản lý</h2>
              <p className="home__section-subtitle">
                Giám sát và quản lý xe tại các trạm được phân công
              </p>
            </div>
          )}

          {user && user.role === 'admin' && (
            <div className="home__section">
              <h2 className="home__section-title">Tổng quan hệ thống</h2>
              <p className="home__section-subtitle">
                Tầm nhìn toàn diện về hoạt động đội xe
              </p>
            </div>
          )}

          {!user && (
            <div className="home__section">
              <h2 className="home__section-title">Khám phá dịch vụ của chúng tôi</h2>
              <p className="home__section-subtitle">
                Xem các xe có sẵn và chọn trạm phù hợp
              </p>
            </div>
          )}

          <div className="home__vehicles">
            <div className="home__vehicles-header">
              <h3 className="home__subsection-title">Danh sách xe</h3>
              <div className="home__vehicles-meta">
                <span className="home__vehicles-count">
                  {filteredVehicles.length}/{totalModels} mẫu xe
                </span>
                {searchQuery && (
                  <span className="home__vehicles-query">Từ khóa: “{searchQuery}”</span>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="home__vehicles-loading">Đang tải dữ liệu xe...</div>
            ) : filteredVehicles.length === 0 ? (
              <div className="home__vehicles-empty">
                <p>Không tìm thấy mẫu xe phù hợp.</p>
                <p>Thử điều chỉnh từ khóa tìm kiếm của bạn.</p>
              </div>
            ) : (
              <div className="home__vehicles-grid">
                {filteredVehicles.map((vehicle) => (
                  <NewVehicleCard
                    key={vehicle.vehicle_id}
                    vehicle={vehicle}
                    onRentVehicle={handleRentVehicle}
                    onViewDetail={handleCardView}
                    userRole={user?.role || 'customer'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {selectedVehicle && (
        <div className="home__modal-overlay" onClick={() => setSelectedVehicle(null)}>
          <div className="home__modal" onClick={(event) => event.stopPropagation()}>
            <button className="home__modal-close" onClick={() => setSelectedVehicle(null)}>
              <XCircle size={20} />
            </button>

            <div className="home__modal-header">
              <span className={`home__modal-status home__modal-status--${selectedVehicle.status.toLowerCase()}`}>
                {getStatusLabel(selectedVehicle.status)}
              </span>
              <h2>{selectedVehicle.name}</h2>
              <p>
                {selectedVehicle.manufacturer
                  ? `${selectedVehicle.manufacturer} • ${selectedVehicle.type_name}`
                  : selectedVehicle.type_name}
              </p>
            </div>

            <div className="home__modal-body">
              <div className="home__modal-image">
                <CloudinaryImage
                  src={selectedVehicle.img}
                  alt={selectedVehicle.name}
                  className="home__modal-image-content"
                  cropToSquare={false}
                  width={960}
                  height={540}
                  fallback={
                    <div className="home__modal-image-placeholder">
                      <Car size={64} />
                    </div>
                  }
                />
              </div>

              <div className="home__modal-grid">
                <div className="home__modal-card">
                  <Car size={20} />
                  <div>
                    <span>Loại phương tiện</span>
                    <strong>{selectedVehicle.type_name}</strong>
                  </div>
                </div>
                <div className="home__modal-card">
                  <Shield size={20} />
                  <div>
                    <span>Giá thuê</span>
                    <strong>{selectedVehicle.price_per_hour.toLocaleString('vi-VN')} VNĐ/giờ</strong>
                  </div>
                </div>
                <div className="home__modal-card">
                  <Battery size={20} />
                  <div>
                    <span>Dung lượng pin</span>
                    <strong>{formatMetricWithUnit(selectedVehicle.battery_capacity, 'kWh')}</strong>
                  </div>
                </div>
                <div className="home__modal-card">
                  <Gauge size={20} />
                  <div>
                    <span>Tầm hoạt động</span>
                    <strong>{formatMetricWithUnit(selectedVehicle.range, 'km')}</strong>
                  </div>
                </div>
                {selectedVehicle.color && (
                  <div className="home__modal-card home__modal-card--color">
                    <span
                      className="home__modal-color-swatch"
                      style={{ backgroundColor: selectedVehicle.color }}
                    />
                    <div>
                      <span>Màu sắc</span>
                      <strong>{selectedVehicle.color}</strong>
                    </div>
                  </div>
                )}
              </div>

              {selectedVehicle.typeDescription && (
                <div className="home__modal-description">
                  <h3>Mô tả loại xe</h3>
                  <p>{selectedVehicle.typeDescription}</p>
                </div>
              )}

              {selectedVehicle.specs && (
                <div className="home__modal-description">
                  <h3>Thông số nổi bật</h3>
                  <p>{selectedVehicle.specs}</p>
                </div>
              )}

              {selectedVehicle.battery_level !== undefined && (
                <div className="home__modal-battery">
                  <span>Mức pin hiện tại</span>
                  <div className="home__modal-battery-bar">
                    <div
                      className={`home__modal-battery-fill home__modal-battery-fill--${getBatteryVariant(selectedVehicle.battery_level)}`}
                      style={{ width: `${selectedVehicle.battery_level}%` }}
                    />
                  </div>
                  <strong>{selectedVehicle.battery_level}%</strong>
                </div>
              )}
            </div>

            <div className="home__modal-footer">
              <button
                className="home__modal-btn home__modal-btn--primary"
                onClick={() => handleRentVehicle(selectedVehicle)}
              >
                Thuê ngay
              </button>
              <button className="home__modal-btn" onClick={() => setSelectedVehicle(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;