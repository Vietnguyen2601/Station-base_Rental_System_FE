import React, { useState, useMemo } from 'react';
import { Search, MapPin, Battery, Clock, TrendingUp } from 'lucide-react';
import NewVehicleCard from '../../components/NewVehicleCard/NewVehicleCard';
import Navbar from '../../components/Navbar/Navbar';
import { User, Vehicle as NewVehicle, NewVehicleCardData } from '../../types';
import { mockVehicles, mockVehicleModels, mockVehicleTypes } from '../../utils/vehicleMockData';
import './Home.scss';


interface HomeProps {
  user?: User;
  onLogin?: () => void;
  onRegister?: () => void;
  onViewVehicleDetail?: (vehicleId: string) => void;
}

const Home: React.FC<HomeProps> = ({ user, onLogin, onRegister, onViewVehicleDetail }) => {

  const [searchQuery, setSearchQuery] = useState('');

  // Convert new vehicle format to NewVehicleCardData format
  const convertToNewVehicleCardData = (vehicle: NewVehicle): NewVehicleCardData => {
    const model = mockVehicleModels.find(m => m.vehicle_model_id === vehicle.model_id);
    const type = model ? mockVehicleTypes.find(t => t.vehicle_type_id === model.type_id) : undefined;

    return {
      vehicle_id: vehicle.vehicle_id,
      name: model ? `${model.manufacturer} ${model.name}` : 'Unknown Vehicle',
      price_per_hour: model?.price_per_hour || 0,
      battery_capacity: vehicle.battery_capacity || 0,
      range: vehicle.range || 0,
      type_name: type?.type_name || 'Unknown Type',
      status: vehicle.status,
      img: vehicle.img,
      battery_level: vehicle.battery_level,
      color: vehicle.color
    };
  };

  // Get available vehicles for display
  const displayVehicles = useMemo(() => {
    return mockVehicles
      .filter(v => v.isActive)
      .slice(0, 4)
      .map(convertToNewVehicleCardData);
  }, []);


  const handleRentVehicle = (vehicle: NewVehicleCardData) => {
    alert(`Rental process started for ${vehicle.name}`);
  };

  const handleViewVehicleDetail = (vehicle: NewVehicleCardData) => {
    console.log('Home handleViewVehicleDetail called with vehicle:', vehicle);
    console.log('onViewVehicleDetail prop:', onViewVehicleDetail);
    if (onViewVehicleDetail) {
      console.log('Calling onViewVehicleDetail with vehicle_id:', vehicle.vehicle_id);
      onViewVehicleDetail(vehicle.vehicle_id);
    } else {
      console.log('onViewVehicleDetail is not provided');
    }
  };

  const totalVehicles = mockVehicles.filter(v => v.isActive).length;
  const availableVehicles = mockVehicles.filter(v => v.isActive && v.status === 'AVAILABLE').length;

  return (
    <div className="home">
      {/* Navbar for unauthenticated users */}
      {!user && onLogin && onRegister && (
        <Navbar onLogin={onLogin} onRegister={onRegister} />
      )}

      {/* Hero Section */}
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
            
            {/* Search Section */}
            <div className="home__search">
              <div className="home__search-input">
                <Search className="home__search-icon" />
                <input
                  type="text"
                  placeholder="Search stations by name or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="home__search-field"
                />
              </div>
            </div>

            {/* Quick Stats */}
            <div className="home__stats">
              <div className="home__stat">
                <Battery className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">{availableVehicles}</span>
                  <span className="home__stat-label">Available Vehicles</span>
                </div>
              </div>
              <div className="home__stat">
                <TrendingUp className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">{totalVehicles}</span>
                  <span className="home__stat-label">Total Fleet</span>
                </div>
              </div>
              <div className="home__stat">
                <Clock className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">24/7</span>
                  <span className="home__stat-label">Service Hours</span>
                </div>
              </div>
              <div className="home__stat">
                <MapPin className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">3</span>
                  <span className="home__stat-label">Active Stations</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Main Content */}
      <section className="home__content">
        <div className="container">
          {/* User Role Based Content */}
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

          {/* Public content for unauthenticated users */}
          {!user && (
            <div className="home__section">
              <h2 className="home__section-title">Khám phá dịch vụ của chúng tôi</h2>
              <p className="home__section-subtitle">
                Xem các xe có sẵn và chọn trạm phù hợp
              </p>
            </div>
          )}


          {/* Vehicles Section */}
          <div className="home__vehicles">
            <h3 className="home__subsection-title">Xe nổi bật</h3>
            <div className="home__vehicles-grid">
              {displayVehicles.map((vehicle) => (
                <NewVehicleCard
                  key={vehicle.vehicle_id}
                  vehicle={vehicle}
                  onRentVehicle={handleRentVehicle}
                  onViewDetail={handleViewVehicleDetail}
                  userRole={user?.role || 'customer'}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;