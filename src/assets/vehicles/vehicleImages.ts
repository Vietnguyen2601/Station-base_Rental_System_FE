import car01 from './car01.jfif';
import car02 from './car02.jfif';
import car03 from './car03.jfif';
import car04 from './car04.jfif';
import car05 from './car05.jfif';
import car06 from './car06.jfif';

// Pair local assets with the vehicle models and names they should represent.
const VEHICLE_MODEL_IMAGE_MAP: Record<string, string> = {
  'vm-001': car01, // Tesla Model 3 (Sedan)
  'vm-002': car02, // Nissan Leaf (Sedan)
  'vm-003': car04, // Tesla Model Y (SUV)
  'vm-004': car03, // BMW i3 (Sedan)
  'vm-005': car04, // Hyundai Kona EV (Crossover)
  'vm-006': car05, // Audi e-tron GT (Luxury)
  'vm-007': car06, // Volkswagen ID.4 (SUV)
  'vm-008': car02, // Renault Zoe (Compact)
  'vm-009': car05, // Ford Mustang Mach-E (SUV)
  'vm-010': car03, // Polestar 2 (Sedan)
};

const VEHICLE_NAME_IMAGE_MAP: Record<string, string> = {
  'Tesla Model 3': car01,
  'Model 3': car01,
  'Tesla Model Y': car04,
  'Model Y': car04,
  'Nissan Leaf': car02,
  'BMW i3': car03,
  'Hyundai Kona EV': car04,
  'Volkswagen ID.4': car06,
  'VW ID.4': car06,
  'Audi e-tron GT': car05,
  'Ford Mustang Mach-E': car05,
  'Polestar 2': car03,
  'Renault Zoe': car02,
};

const DEFAULT_VEHICLE_IMAGE = car01;

export const SEDAN_IMAGES = [car01, car02, car03];
export const SUV_IMAGES = [car04, car05, car06];

export const getVehicleImageByModel = (modelId: string): string => {
  return VEHICLE_MODEL_IMAGE_MAP[modelId] ?? DEFAULT_VEHICLE_IMAGE;
};

export const getVehicleImageByName = (name: string): string => {
  return VEHICLE_NAME_IMAGE_MAP[name] ?? DEFAULT_VEHICLE_IMAGE;
};

export {
  car01,
  car02,
  car03,
  car04,
  car05,
  car06,
  VEHICLE_MODEL_IMAGE_MAP,
  VEHICLE_NAME_IMAGE_MAP,
  DEFAULT_VEHICLE_IMAGE,
};
