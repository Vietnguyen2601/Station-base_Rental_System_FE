// TypeScript interfaces for EV Rental System

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'staff' | 'admin';
  phone?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: Date;
}

export interface Vehicle {
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
  onSelectStation: (station: Station) => void;
}

export interface VehicleCardProps {
  vehicle: Vehicle;
  onRentVehicle: (vehicle: Vehicle) => void;
  userRole: User['role'];
}

// Authentication Types
export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginFormProps {
  onSubmit: (credentials: LoginCredentials) => void;
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
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  licenseFile?: File;
  idFile?: File;
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