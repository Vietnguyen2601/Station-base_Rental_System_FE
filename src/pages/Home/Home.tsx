import React, { useState, useEffect } from 'react';
import { Search, MapPin, Battery, Clock, TrendingUp } from 'lucide-react';
import StationCard from '../../components/StationCard/StationCard';
import VehicleCard from '../../components/VehicleCard/VehicleCard';
import { Station, Vehicle, User } from '../../types';
import './Home.scss';

// Mock data - In a real app, this would come from an API
const mockStations: Station[] = [
  {
    id: '1',
    name: 'Downtown Hub',
    address: '123 Main Street, Downtown',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    availableVehicles: 8,
    totalVehicles: 12,
    status: 'active',
    facilities: ['Fast Charging', 'Parking', '24/7 Access', 'WiFi']
  },
  {
    id: '2',
    name: 'Airport Terminal',
    address: '456 Airport Blvd, Terminal B',
    coordinates: { lat: 40.6892, lng: -74.1745 },
    availableVehicles: 3,
    totalVehicles: 15,
    status: 'active',
    facilities: ['Fast Charging', 'Covered Parking', 'Security']
  },
  {
    id: '3',
    name: 'University Campus',
    address: '789 College Ave, Campus Center',
    coordinates: { lat: 40.7282, lng: -74.0776 },
    availableVehicles: 0,
    totalVehicles: 8,
    status: 'maintenance',
    facilities: ['Standard Charging', 'Student Discounts', 'Bike Racks']
  }
];

const mockVehicles: Vehicle[] = [
  {
    id: '1',
    name: 'Tesla Model 3',
    model: '2023 Standard Range',
    batteryLevel: 85,
    status: 'available',
    location: 'Downtown Hub',
    pricePerHour: 25,
    imageUrl: 'https://images.pexels.com/photos/35967/mini-cooper-auto-model-vehicle.jpg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '2',
    name: 'Nissan Leaf',
    model: '2022 Plus',
    batteryLevel: 92,
    status: 'available',
    location: 'Airport Terminal',
    pricePerHour: 20,
    imageUrl: 'https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '3',
    name: 'BMW i3',
    model: '2023 eDrive40',
    batteryLevel: 15,
    status: 'charging',
    location: 'Downtown Hub',
    pricePerHour: 30,
    imageUrl: 'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '4',
    name: 'Hyundai Kona EV',
    model: '2023 Ultimate',
    batteryLevel: 78,
    status: 'rented',
    location: 'University Campus',
    pricePerHour: 22
  }
];

interface HomeProps {
  user?: User;
}

const Home: React.FC<HomeProps> = ({ user }) => {
  if (!user) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [filteredStations, setFilteredStations] = useState<Station[]>(mockStations);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStations(mockStations);
    } else {
      const filtered = mockStations.filter(station =>
        station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        station.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStations(filtered);
    }
  }, [searchQuery]);

  const handleSelectStation = (station: Station) => {
    setSelectedStation(station);
  };

  const handleRentVehicle = (vehicle: Vehicle) => {
    alert(`Rental process started for ${vehicle.name}`);
  };

  const availableStations = mockStations.filter(s => s.status === 'active').length;
  const totalVehicles = mockStations.reduce((sum, s) => sum + s.totalVehicles, 0);
  const availableVehicles = mockStations.reduce((sum, s) => sum + s.availableVehicles, 0);

  return (
    <div className="home">
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
                <MapPin className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">{availableStations}</span>
                  <span className="home__stat-label">Active Stations</span>
                </div>
              </div>
              <div className="home__stat">
                <Battery className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">{availableVehicles}</span>
                  <span className="home__stat-label">Available Vehicles</span>
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
                <TrendingUp className="home__stat-icon" />
                <div className="home__stat-content">
                  <span className="home__stat-number">{totalVehicles}</span>
                  <span className="home__stat-label">Total Fleet</span>
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
          {user.role === 'customer' && (
            <div className="home__section">
              <h2 className="home__section-title">Tìm chuyến xe hoàn hảo</h2>
              <p className="home__section-subtitle">
                Duyệt qua các trạm và xe có sẵn trong khu vực của bạn
              </p>
            </div>
          )}

          {user.role === 'staff' && (
            <div className="home__section">
              <h2 className="home__section-title">Bảng điều khiển quản lý trạm</h2>
              <p className="home__section-subtitle">
                Giám sát và quản lý xe tại các trạm được phân công
              </p>
            </div>
          )}

          {user.role === 'admin' && (
            <div className="home__section">
              <h2 className="home__section-title">Tổng quan hệ thống</h2>
              <p className="home__section-subtitle">
                Tầm nhìn toàn diện về tất cả các trạm và hoạt động đội xe
              </p>
            </div>
          )}

          {/* Stations Grid */}
          <div className="home__stations">
            <h3 className="home__subsection-title">
              {searchQuery ? `Kết quả tìm kiếm (${filteredStations.length})` : 'Trạm có sẵn'}
            </h3>
            <div className="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-3">
              {filteredStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  onSelectStation={handleSelectStation}
                />
              ))}
            </div>
          </div>

          {/* Vehicles Section */}
          <div className="home__vehicles">
            <h3 className="home__subsection-title">Xe nổi bật</h3>
            <div className="grid grid-cols-1 grid-md-cols-2 grid-lg-cols-4">
              {mockVehicles.slice(0, 4).map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onRentVehicle={handleRentVehicle}
                  userRole={user.role}
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