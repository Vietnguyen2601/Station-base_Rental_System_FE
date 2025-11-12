// Barrel export for services
export { default as apiClient } from './apiClient';
export { authService } from './authService';
export { vehicleService } from './vehicleService';
export { stationService } from './stationService';
export { accountService } from './accountService';
export { orderService } from './orderService';
export { promotionService } from './promotionService';
export { walletService } from './walletService';
export { paymentService } from './paymentService';
export { default as dashboardService } from './dashboardService';
export { default as damageReportService } from './damageReportService';
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
export type {
  BookOrderPayload,
  BookOrderData,
  OrderRecord,
  VerifyOrderCodeResponse,
  UpdateReturnTimeResponse,
} from './orderService';
export type { Promotion, CreatePromotionPayload } from './promotionService';
export type { WalletRecord } from './walletService';
export type {
  FinalPriceSummary,
  FinalizeReturnPayload,
  FinalizeReturnResult,
  PaymentApiResponse,
} from './paymentService';
export type {
  StationOrderMetrics,
  StationRevenueMetrics,
  StationOrdersSummary,
  StationRevenueSummary,
  StationUsageMetrics,
  StationUsageSummary,
  StationOrdersFilters,
} from './dashboardService';
export type { DamageLevel, DamageReportPayload, DamageReportRecord } from './damageReportService';