/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { MapPin, Filter, Car, Battery, DollarSign, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Station, Vehicle, User, BookingData, BookingConfirmation } from '../../types';
import { mockStations, mockVehicles } from '../../utils/mockData';
import './Booking.scss';

interface BookingProps {
  user?: User;
}

const Booking: React.FC<BookingProps> = ({ user }) => {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [filteredStations, setFilteredStations] = useState<Station[]>(mockStations);
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    batteryLevel: 0,
    priceRange: [0, 100],
    vehicleType: 'all'
  });
  const [bookingStep, setBookingStep] = useState<'stations' | 'vehicles' | 'details' | 'confirmation'>('stations');
  // const [bookingData, setBookingData] = useState<Partial<BookingData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  // Filter stations based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredStations(mockStations.filter(station => station.status === 'active'));
    } else {
      const filtered = mockStations.filter(station =>
        station.status === 'active' && (
          station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          station.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredStations(filtered);
    }
  }, [searchQuery]);

  // Load available vehicles when station is selected
  useEffect(() => {
    if (selectedStation) {
      const vehicles = mockVehicles.filter(vehicle => 
        vehicle.location === selectedStation.name && 
        vehicle.status === 'available' &&
        vehicle.batteryLevel >= filters.batteryLevel &&
        vehicle.pricePerHour >= filters.priceRange[0] &&
        vehicle.pricePerHour <= filters.priceRange[1]
      );
      setAvailableVehicles(vehicles);
    }
  }, [selectedStation, filters]);

  // Handle station selection
  const handleStationSelect = (station: Station) => {
    if (station.availableVehicles === 0) {
      setError('No vehicles available at this station. Please select another station.');
      return;
    }
    setSelectedStation(station);
    setBookingStep('vehicles');
    setError('');
  };

  // Handle vehicle selection
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setBookingStep('details');
  };

  // Handle booking confirmation
  const handleBookingConfirm = async (details: Partial<BookingData>) => {
    if (!selectedStation || !selectedVehicle || !user) return;

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create booking data
      const booking: BookingData = {
        userId: user.id,
        vehicleId: selectedVehicle.id,
        stationId: selectedStation.id,
        startDate: details.startDate || new Date(),
        endDate: details.endDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
        estimatedCost: details.estimatedCost || 0
      };

      // Create confirmation
      const bookingConfirmation: BookingConfirmation = {
        id: `BK${Date.now()}`,
        bookingData: booking,
        confirmationCode: `EVR${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: 'confirmed'
      };

      setConfirmation(bookingConfirmation);
      setBookingStep('confirmation');
    } catch (err) {
      setError('Booking failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render map placeholder
  const renderMapPlaceholder = () => (
    <div className="booking__map">
      <div className="booking__map-placeholder">
        <MapPin size={48} />
        <h3>Interactive Map</h3>
        <p>Map integration with Leaflet or Google Maps would be implemented here</p>
        <div className="booking__map-stations">
          {filteredStations.map(station => (
            <div
              key={station.id}
              className="booking__map-marker"
              onClick={() => handleStationSelect(station)}
            >
              <MapPin size={16} />
              <span>{station.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render station selection step
  const renderStationSelection = () => (
    <div className="booking__step">
      <div className="booking__step-header">
        <h2 className="booking__step-title">Select a Station</h2>
        <p className="booking__step-subtitle">Choose from available stations near you</p>
      </div>

      {/* Search and Filters */}
      <div className="booking__controls">
        <div className="booking__search">
          <input
            type="text"
            placeholder="Search stations by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="booking__search-input"
          />
        </div>
        
        <div className="booking__filters">
          <button className="booking__filter-btn">
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="booking__error">
          <span>{error}</span>
        </div>
      )}

      {/* Map and Station List */}
      <div className="booking__content">
        {renderMapPlaceholder()}
        
        <div className="booking__stations">
          <h3 className="booking__stations-title">Available Stations ({filteredStations.length})</h3>
          <div className="booking__stations-list">
            {filteredStations.map(station => (
              <div
                key={station.id}
                className="booking__station-card"
                onClick={() => handleStationSelect(station)}
              >
                <div className="booking__station-header">
                  <h4 className="booking__station-name">{station.name}</h4>
                  <div className="booking__station-availability">
                    <Car size={16} />
                    <span>{station.availableVehicles}/{station.totalVehicles}</span>
                  </div>
                </div>
                <p className="booking__station-address">{station.address}</p>
                <div className="booking__station-facilities">
                  {station.facilities.slice(0, 3).map((facility, index) => (
                    <span key={index} className="booking__facility-tag">{facility}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render vehicle selection step
  const renderVehicleSelection = () => (
    <div className="booking__step">
      <div className="booking__step-header">
        <button
          onClick={() => setBookingStep('stations')}
          className="booking__back-btn"
        >
          ← Back to Stations
        </button>
        <h2 className="booking__step-title">Select a Vehicle</h2>
        <p className="booking__step-subtitle">
          Available vehicles at {selectedStation?.name}
        </p>
      </div>

      {availableVehicles.length === 0 ? (
        <div className="booking__no-vehicles">
          <Car size={48} />
          <h3>No vehicles available</h3>
          <p>Try adjusting your filters or select a different station</p>
        </div>
      ) : (
        <div className="booking__vehicles">
          {availableVehicles.map(vehicle => (
            <div
              key={vehicle.id}
              className="booking__vehicle-card"
              onClick={() => handleVehicleSelect(vehicle)}
            >
              {vehicle.imageUrl && (
                <div className="booking__vehicle-image">
                  <img src={vehicle.imageUrl} alt={vehicle.name} />
                </div>
              )}
              <div className="booking__vehicle-content">
                <h4 className="booking__vehicle-name">{vehicle.name}</h4>
                <p className="booking__vehicle-model">{vehicle.model}</p>
                
                <div className="booking__vehicle-stats">
                  <div className="booking__vehicle-stat">
                    <Battery size={16} />
                    <span>{vehicle.batteryLevel}%</span>
                  </div>
                  <div className="booking__vehicle-stat">
                    <DollarSign size={16} />
                    <span>${vehicle.pricePerHour}/hr</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // BookingDetails Component
  const BookingDetails: React.FC = () => {
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 16));
    const [endDate, setEndDate] = useState(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
    const [duration, setDuration] = useState(24);
    const [estimatedCost, setEstimatedCost] = useState(0);

    useEffect(() => {
      if (selectedVehicle) {
        const hours = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60));
        setDuration(hours);
        setEstimatedCost(hours * selectedVehicle.pricePerHour);
      }
    }, [startDate, endDate, selectedVehicle]);

    const handleConfirm = () => {
      handleBookingConfirm({
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        estimatedCost
      });
    };

    return (
      <div className="booking__step">
        <div className="booking__step-header">
          <button
            onClick={() => setBookingStep('vehicles')}
            className="booking__back-btn"
          >
            ← Back to Vehicles
          </button>
          <h2 className="booking__step-title">Booking Details</h2>
          <p className="booking__step-subtitle">Review and confirm your booking</p>
        </div>

        <div className="booking__details">
          <div className="booking__details-summary">
            <h3>Booking Summary</h3>
            <div className="booking__summary-item">
              <span>Station:</span>
              <span>{selectedStation?.name}</span>
            </div>
            <div className="booking__summary-item">
              <span>Vehicle:</span>
              <span>{selectedVehicle?.name}</span>
            </div>
            <div className="booking__summary-item">
              <span>Rate:</span>
              <span>${selectedVehicle?.pricePerHour}/hour</span>
            </div>
          </div>

          <div className="booking__details-form">
            <div className="booking__form-group">
              <label htmlFor="startDate">Start Date & Time</label>
              <input
                type="datetime-local"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="booking__input"
              />
            </div>

            <div className="booking__form-group">
              <label htmlFor="endDate">End Date & Time</label>
              <input
                type="datetime-local"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate}
                className="booking__input"
              />
            </div>

            <div className="booking__cost-breakdown">
              <h4>Cost Breakdown</h4>
              <div className="booking__cost-item">
                <span>Duration:</span>
                <span>{duration} hours</span>
              </div>
              <div className="booking__cost-item">
                <span>Rate:</span>
                <span>${selectedVehicle?.pricePerHour}/hour</span>
              </div>
              <div className="booking__cost-item booking__cost-total">
                <span>Estimated Total:</span>
                <span>${estimatedCost}</span>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="booking__confirm-btn btn btn-primary"
            >
              {isLoading ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render confirmation step
  const renderConfirmation = () => (
    <div className="booking__step">
      <div className="booking__confirmation">
        <div className="booking__confirmation-header">
          <CheckCircle className="booking__confirmation-icon" />
          <h2 className="booking__confirmation-title">Booking Confirmed!</h2>
          <p className="booking__confirmation-subtitle">
            Your vehicle has been reserved successfully
          </p>
        </div>

        <div className="booking__confirmation-details">
          <div className="booking__confirmation-code">
            <h3>Confirmation Code</h3>
            <div className="booking__code">{confirmation?.confirmationCode}</div>
          </div>

          <div className="booking__confirmation-summary">
            <h3>Booking Details</h3>
            <div className="booking__summary-grid">
              <div className="booking__summary-item">
                <span>Booking ID:</span>
                <span>{confirmation?.id}</span>
              </div>
              <div className="booking__summary-item">
                <span>Station:</span>
                <span>{selectedStation?.name}</span>
              </div>
              <div className="booking__summary-item">
                <span>Vehicle:</span>
                <span>{selectedVehicle?.name}</span>
              </div>
              <div className="booking__summary-item">
                <span>Start Time:</span>
                <span>{confirmation?.bookingData.startDate.toLocaleString()}</span>
              </div>
              <div className="booking__summary-item">
                <span>End Time:</span>
                <span>{confirmation?.bookingData.endDate.toLocaleString()}</span>
              </div>
              <div className="booking__summary-item">
                <span>Estimated Cost:</span>
                <span>${confirmation?.bookingData.estimatedCost}</span>
              </div>
            </div>
          </div>

          <div className="booking__next-steps">
            <h3>Next Steps</h3>
            <ul>
              <li>Arrive at the station 15 minutes before your start time</li>
              <li>Bring your driver's license and confirmation code</li>
              <li>Complete the check-in process with station staff</li>
              <li>Enjoy your ride!</li>
            </ul>
          </div>
        </div>

        <div className="booking__confirmation-actions">
          <button
            onClick={() => window.location.href = '/'}
            className="btn btn-primary"
          >
            Return to Home
          </button>
          <button
            onClick={() => window.location.href = '/history'}
            className="btn btn-outline"
          >
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="booking">
      <div className="container">
        {/* Progress Indicator Section */}
        <div className="booking__progress-wrapper">
          <div className="booking__progress">
            <div className={`booking__progress-step ${bookingStep === 'stations' ? 'active' : ['vehicles', 'details', 'confirmation'].includes(bookingStep) ? 'completed' : ''}`}>
              <div className="booking__progress-circle">1</div>
              <span>Station</span>
            </div>
            <div className="booking__progress-line"></div>
            <div className={`booking__progress-step ${bookingStep === 'vehicles' ? 'active' : ['details', 'confirmation'].includes(bookingStep) ? 'completed' : ''}`}>
              <div className="booking__progress-circle">2</div>
              <span>Vehicle</span>
            </div>
            <div className="booking__progress-line"></div>
            <div className={`booking__progress-step ${bookingStep === 'details' ? 'active' : bookingStep === 'confirmation' ? 'completed' : ''}`}>
              <div className="booking__progress-circle">3</div>
              <span>Details</span>
            </div>
            <div className="booking__progress-line"></div>
            <div className={`booking__progress-step ${bookingStep === 'confirmation' ? 'active' : ''}`}>
              <div className="booking__progress-circle">4</div>
              <span>Confirm</span>
            </div>
          </div>
        </div>

        {/* Step Content Section */}
        <div className="booking__content">
          {bookingStep === 'stations' && renderStationSelection()}
          {bookingStep === 'vehicles' && renderVehicleSelection()}
          {bookingStep === 'details' && <BookingDetails />}
          {bookingStep === 'confirmation' && renderConfirmation()}
        </div>
      </div>
    </div>
  );
};

export default Booking;