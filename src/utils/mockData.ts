// Mock data utilities for development and testing

import { Station, Vehicle, User, Rental } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Nguyễn Văn An',
    email: 'customer@evrental.com',
    role: 'customer',
    phone: '+84 901 234 567',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
    isActive: true,
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    name: 'Trần Thị Bình',
    email: 'staff@evrental.com',
    role: 'staff',
    phone: '+84 902 345 678',
    avatar: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150',
    isActive: true,
    createdAt: new Date('2023-12-01')
  },
  {
    id: '3',
    name: 'Lê Minh Cường',
    email: 'admin@evrental.com',
    role: 'admin',
    phone: '+84 903 456 789',
    avatar: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=150',
    isActive: true,
    createdAt: new Date('2023-10-01')
  }
];

// Mock credentials for testing (password: 123456 for all accounts)
export const mockCredentials = [
  { email: 'customer@evrental.com', password: '123456', role: 'customer' },
  { email: 'staff@evrental.com', password: '123456', role: 'staff' },
  { email: 'admin@evrental.com', password: '123456', role: 'admin' }
];

export const mockStations: Station[] = [
  {
    id: '1',
    name: 'Downtown Hub',
    address: '123 Main Street, Downtown',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    availableVehicles: 8,
    totalVehicles: 12,
    status: 'active',
    facilities: ['Fast Charging', 'Parking', '24/7 Access', 'WiFi', 'Restrooms']
  },
  {
    id: '2',
    name: 'Airport Terminal',
    address: '456 Airport Blvd, Terminal B',
    coordinates: { lat: 40.6892, lng: -74.1745 },
    availableVehicles: 3,
    totalVehicles: 15,
    status: 'active',
    facilities: ['Fast Charging', 'Covered Parking', 'Security', '24/7 Access']
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
  },
  {
    id: '4',
    name: 'Shopping Mall',
    address: '321 Commerce Dr, Shopping District',
    coordinates: { lat: 40.7589, lng: -73.9851 },
    availableVehicles: 5,
    totalVehicles: 10,
    status: 'active',
    facilities: ['Fast Charging', 'Indoor Parking', 'Shopping', 'Food Court']
  },
  {
    id: '5',
    name: 'Business District',
    address: '555 Corporate Plaza, Financial District',
    coordinates: { lat: 40.7505, lng: -73.9934 },
    availableVehicles: 7,
    totalVehicles: 14,
    status: 'active',
    facilities: ['Ultra-Fast Charging', 'Valet Service', 'Business Lounge', 'WiFi']
  }
];

export const mockVehicles: Vehicle[] = [
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
  },
  {
    id: '5',
    name: 'Volkswagen ID.4',
    model: '2023 Pro',
    batteryLevel: 67,
    status: 'available',
    location: 'Shopping Mall',
    pricePerHour: 28
  },
  {
    id: '6',
    name: 'Audi e-tron GT',
    model: '2023 Premium',
    batteryLevel: 88,
    status: 'available',
    location: 'Business District',
    pricePerHour: 45
  }
];

export const mockRentals: Rental[] = [
  {
    id: '1',
    userId: '1',
    vehicleId: '4',
    stationId: '3',
    startTime: new Date('2024-01-15T09:00:00Z'),
    endTime: new Date('2024-01-15T12:30:00Z'),
    status: 'completed',
    totalCost: 77
  },
  {
    id: '2',
    userId: '1',
    vehicleId: '2',
    stationId: '2',
    startTime: new Date('2024-01-18T14:15:00Z'),
    status: 'active'
  }
];

// Utility functions for working with mock data
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

export const getStationById = (id: string): Station | undefined => {
  return mockStations.find(station => station.id === id);
};

export const getVehicleById = (id: string): Vehicle | undefined => {
  return mockVehicles.find(vehicle => vehicle.id === id);
};

export const getVehiclesByStation = (stationName: string): Vehicle[] => {
  return mockVehicles.filter(vehicle => vehicle.location === stationName);
};

export const getActiveRentalsByUser = (userId: string): Rental[] => {
  return mockRentals.filter(rental => 
    rental.userId === userId && rental.status === 'active'
  );
};

export const getRentalHistory = (userId: string): Rental[] => {
  return mockRentals.filter(rental => rental.userId === userId);
};