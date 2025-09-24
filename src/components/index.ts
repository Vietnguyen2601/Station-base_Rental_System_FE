// Barrel export for all components
// This allows clean imports like: import { Header, Footer, Button } from '@/components'

// Layout Components
export { default as Header } from './layout/Header/Header';
export { default as Footer } from './layout/Footer/Footer';
export { default as Sidebar } from './layout/Sidebar/Sidebar';
export { default as Layout } from './layout/Layout/Layout';

// Common Components
export { default as LoadingSpinner } from './common/LoadingSpinner/LoadingSpinner';
export { default as ErrorBoundary } from './common/ErrorBoundary/ErrorBoundary';
export { default as ConfirmDialog } from './common/ConfirmDialog/ConfirmDialog';

// UI Components
export { default as Button } from './ui/Button/Button';
export { default as Input } from './ui/Input/Input';
export { default as Modal } from './ui/Modal/Modal';
export { default as Card } from './ui/Card/Card';

// Form Components
export { default as SearchForm } from './forms/SearchForm/SearchForm';
export { default as RentalForm } from './forms/RentalForm/RentalForm';

// Feature-specific Components
export { default as StationCard } from './StationCard/StationCard';
export { default as VehicleCard } from './VehicleCard/VehicleCard';