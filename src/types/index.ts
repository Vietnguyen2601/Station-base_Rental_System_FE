// TypeScript interfaces for EV Rental System

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'customer' | 'staff' | 'admin';
  contactNumber?: string;
  avatar?: string;
  isActive?: boolean;
  createdAt?: Date;
}

// Database Schema Types
export interface VehicleType {
  vehicle_type_id: string;
  type_name: string;
  description?: string;
  created_at: Date;
  isActive: boolean;
  updated_at?: Date;
}

export interface VehicleModel {
  vehicle_model_id: string;
  type_id: string;
  name: string;
  manufacturer: string;
  price_per_hour: number;
  specs?: string;
  created_at: Date;
  isActive: boolean;
  updated_at?: Date;
}

export interface Vehicle {
  vehicle_id: string;
  serial_number: string;
  model_id: string;
  station_id?: string;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'CHARGING';
  battery_level?: number;
  battery_capacity?: number;
  range?: number;
  color?: string;
  last_maintenance?: Date;
  img?: string;
  created_at: Date;
  isActive: boolean;
  updated_at?: Date;
}

// Legacy Vehicle interface for backward compatibility
export interface LegacyVehicle {
  id: string;
  name: string;
  model: string;
  batteryLevel: number;
  status: 'available' | 'rented' | 'charging' | 'maintenance';
  location: string;
  pricePerHour: number;
  imageUrl?: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  availableVehicles: number;
  totalVehicles: number;
  status: 'active' | 'inactive' | 'maintenance';
  facilities: string[];
}

export interface Rental {
  id: string;
  userId: string;
  vehicleId: string;
  stationId: string;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'cancelled';
  totalCost?: number;
}

export interface NavItem {
  label: string;
  path: string;
  icon?: string;
}

// Component Props Interfaces
export interface HeaderProps {
  user?: User;
  onLogin: () => void;
  onLogout: () => void;
}

export interface FooterProps {
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
}

export interface StationCardProps {
  station: Station;
  onSelectStation?: (station: Station) => void;
}

// New Vehicle Card with database schema fields
export interface NewVehicleCardData {
  vehicle_id: string;
  name: string; // from VehicleModel
  price_per_hour: number; // from VehicleModel
  battery_capacity: number; // from Vehicle
  range: number; // from Vehicle
  type_name: string; // from VehicleType
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'CHARGING';
  img?: string; // from Vehicle
  battery_level?: number; // from Vehicle
  color?: string; // from Vehicle
}

export interface VehicleCardProps {
  vehicle: LegacyVehicle;
  onRentVehicle: (vehicle: LegacyVehicle) => void;
  userRole: User['role'];
}

export interface NewVehicleCardProps {
  vehicle: NewVehicleCardData;
  onRentVehicle: (vehicle: NewVehicleCardData) => void;
  onViewDetail?: (vehicle: NewVehicleCardData) => void;
  userRole: User['role'];
}

// Authentication Types
export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormProps {
  onSubmit: (credentials: { user: User }) => void;
  onForgotPassword: () => void;
  onRegister: () => void;
  isLoading: boolean;
  error?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordFormProps {
  onSubmit: (data: ForgotPasswordData) => void;
  onBackToLogin: () => void;
  isLoading: boolean;
  error?: string;
  success?: boolean;
}

// Registration and Authentication Types
export interface RegistrationData {
  username: string;
  password: string;
  confirmPassword: string;
  email: string;
  contactNumber: string;
}

export interface VerificationData {
  code: string;
  email: string;
}

// Booking Types
export interface BookingData {
  userId: string;
  vehicleId: string;
  stationId: string;
  startDate: Date;
  endDate: Date;
  estimatedCost: number;
}

export interface BookingConfirmation {
  id: string;
  bookingData: BookingData;
  confirmationCode: string;
  status: 'confirmed' | 'pending' | 'cancelled';
}

// Check-in Types
export interface CheckInData {
  bookingId: string;
  staffId: string;
  documentVerified: boolean;
  vehicleInspection: VehicleInspection;
  contractSigned: boolean;
}

export interface VehicleInspection {
  batteryLevel: number;
  exteriorCondition: 'excellent' | 'good' | 'fair' | 'poor';
  interiorCondition: 'excellent' | 'good' | 'fair' | 'poor';
  tiresCondition: 'excellent' | 'good' | 'fair' | 'poor';
  damages: string[];
  notes: string;
}

// Return Types
export interface ReturnData {
  rentalId: string;
  returnStationId: string;
  finalInspection: VehicleInspection;
  mileage: number;
  fuelLevel: number;
  damages: string[];
  additionalFees: number;
  totalCost: number;
}

// Form Props
export interface RegisterFormProps {
  onSubmit: (data: RegistrationData) => void;
  isLoading: boolean;
  error?: string;
}

export interface BookingFormProps {
  vehicle: Vehicle;
  station: Station;
  onConfirm: (booking: BookingData) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export interface CheckInFormProps {
  booking: BookingConfirmation;
  onSubmit: (data: CheckInData) => void;
  isLoading: boolean;
  userRole: User['role'];
}

export interface ReturnFormProps {
  rental: Rental;
  onSubmit: (data: ReturnData) => void;
  isLoading: boolean;
  userRole: User['role'];
}