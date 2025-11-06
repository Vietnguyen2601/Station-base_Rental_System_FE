// Barrel export for services
export { default as apiClient } from './apiClient';
export { authService } from './authService';
export { vehicleService } from './vehicleService';
export { stationService } from './stationService';
export { accountService } from './accountService';
export { orderService } from './orderService';
export { promotionService } from './promotionService';
export { walletService } from './walletService';
export type {
  VehicleType,
  VehicleModel,
  Vehicle,
  HierarchyVehicleType,
  HierarchyVehicleModel,
  HierarchyVehicle,
  HighestBatteryVehicle,
} from './vehicleService';
export type {
  StationRecord,
  CreateStationPayload,
  StationVehicleRecord,
  UpdateStationPayload,
  StationByModelRecord,
} from './stationService';
export type { AccountRecord } from './accountService';
export type { BookOrderPayload, BookOrderData, OrderRecord } from './orderService';
export type { Promotion, CreatePromotionPayload } from './promotionService';
export type { WalletRecord } from './walletService';