# API Integration Summary - Vehicle Management

## 🎯 Current Architecture

### Data Flow

```
Backend (localhost:7250)
    ↓ (API Requests)
Vite Proxy (localhost:3000)
    ↓ (Forward to /api)
apiClient.ts
    ↓ (Create requests)
vehicleService.ts
    ↓ (buildHierarchyData)
VehicleManagement.tsx (Fetch Data)
    ↓
Display in:
  - Table View (Card Grid)
  - Hierarchy View (Tree/Grid)
```

---

## 🔌 API Endpoints

### 1. **Vehicle Types**

- **Endpoint**: `GET /api/VehicleType`
- **Response**:

```json
{
  "message": "Get data success",
  "data": [
    {
      "vehicleTypeId": "f29b49b8-b886-48bf-b58c-37f49b83b76a",
      "typeName": "Sedan",
      "description": "Four-door passenger car",
      "createdAt": "2025-10-23T21:04:51.917582",
      "isactive": true,
      "updatedAt": null
    }
  ]
}
```

- **Used In**: `vehicleService.getVehicleTypes()`

### 2. **Vehicle Models**

- **Endpoint**: `GET /api/VehicleModel`
- **Response**:

```json
{
  "message": "Get data success",
  "data": [
    {
      "vehicleModelId": "0ad1c340-c1c4-4b25-8619-cf8f8fdc066f",
      "typeId": "f29b49b8-b886-48bf-b58c-37f49b83b76a",
      "name": "Camry",
      "manufacturer": "Toyota",
      "pricePerHour": 15,
      "specs": "2.5L 4-cylinder",
      "createdAt": "2025-10-23T21:04:51.917582",
      "isactive": true,
      "updatedAt": null
    }
  ]
}
```

- **Used In**: `vehicleService.getVehicleModels()`

### 3. **Vehicles**

- **Endpoint**: `GET /api/Vehicle`
- **Response**: Array of Vehicle objects with status, fuelLevel, licensePlate, etc.
- **Used In**: `vehicleService.getVehicles()`

---

## 📦 Data Transformation (buildHierarchyData)

```typescript
VehicleType[]
    ↓
vehiclesByModel Map {
  [modelId]: HierarchyVehicle[]
}
    ↓
modelsByType Map {
  [typeId]: HierarchyVehicleModel[]
}
    ↓
HierarchyVehicleType[] (Final)
```

### Final Structure:

```typescript
HierarchyVehicleType {
  id: string (vehicleTypeId)
  name: string (typeName)
  description: string
  models: HierarchyVehicleModel[] {
    id: string (vehicleModelId)
    name: string
    manufacturer: string
    pricePerHour: number
    specs: string
    vehicles: HierarchyVehicle[] {
      id: string (vehicleId)
      licensePlate: string
      currentMileage: number
      fuelLevel: number
      status: string
    }
  }
}
```

---

## 🛠️ Service Methods

### `vehicleService.ts`

| Method                 | Purpose                  | Returns                  |
| ---------------------- | ------------------------ | ------------------------ |
| `getVehicleTypes()`    | Fetch all vehicle types  | `VehicleType[]`          |
| `getVehicleModels()`   | Fetch all vehicle models | `VehicleModel[]`         |
| `getVehicles()`        | Fetch all vehicles       | `Vehicle[]`              |
| `buildHierarchyData()` | Build 3-tier hierarchy   | `HierarchyVehicleType[]` |
| `createVehicleType()`  | Create new type          | `VehicleType`            |
| `createVehicleModel()` | Create new model         | `VehicleModel`           |
| `updateVehicleType()`  | Update type              | `VehicleType`            |
| `deleteVehicleType()`  | Delete type              | `void`                   |

---

## 📍 Proxy Configuration

**File**: `vite.config.ts`

```typescript
proxy: {
  '/api': {
    target: 'https://localhost:7250',
    changeOrigin: true,
    secure: false,
    rewrite: (path) => path.replace(/^\/api/, '/api'),
  }
}
```

**Result**:

- Request: `/api/VehicleType`
- Proxied to: `https://localhost:7250/api/VehicleType`

---

## ⚙️ Configuration

### API Config (`src/config/api.ts`)

```typescript
const isProduction = import.meta.env.PROD;
const backendBaseURL = isProduction ? "https://localhost:7250/api" : "/api"; // Uses proxy in dev

export const API_BASE_URL = backendBaseURL;
export const AUTH_API = `${API_BASE_URL}/Auth`;
```

### API Client (`src/services/apiClient.ts`)

```typescript
const isProduction = import.meta.env.PROD;
const baseURL = isProduction
  ? import.meta.env.VITE_API_BASE_URL || "https://localhost:7250/api"
  : "/api"; // Uses proxy

const apiClient = new ApiClient(baseURL);
```

### Vehicle Service (`src/services/vehicleService.ts`)

```typescript
private baseURL = '/api/Vehicle';
private vehicleTypeURL = '/api/VehicleType';
private vehicleModelURL = '/api/VehicleModel';
```

---

## 🖼️ Components Using API

### VehicleManagement.tsx

- **Fetches**: `vehicleService.buildHierarchyData()`
- **On**: Component mount (useEffect)
- **Displays**:
  - ✅ Table View (Card Grid)
  - ✅ Hierarchy View (Tree/Grid Toggle)
- **Features**:
  - Search by model/type/manufacturer
  - Filter by status
  - Loading/Error states

### VehicleHierarchyView.tsx

- **Receives**: `HierarchyVehicleType[]` as prop
- **Displays**:
  - ✅ Tree View (nested structure)
  - ✅ Grid View (flattened)
- **No API calls** (pure component)

### VehicleManagementModal.tsx

- **Status**: Currently not used in new implementation
- **Note**: Uses old mock data approach
- **TODO**: Update to use new API when needed

---

## 🔄 Data Flow Example

### Login Flow

```
LoginForm.tsx
    ↓
authService.login()
    ↓
POST /api/Auth/login (via proxy)
    ↓
Backend (localhost:7250)
    ↓
Response with tokens
```

### Vehicle Fetch Flow

```
VehicleManagement.tsx (useEffect)
    ↓
vehicleService.buildHierarchyData()
    ↓
Parallel requests:
  - GET /api/VehicleType
  - GET /api/VehicleModel
  - GET /api/Vehicle
    ↓
Transform & group data
    ↓
setHierarchyData()
    ↓
Re-render with tree/card views
```

---

## ✅ Current Status

- ✅ API Service created (`vehicleService.ts`)
- ✅ Proxy configured (`vite.config.ts`)
- ✅ Config updated (`src/config/api.ts`)
- ✅ VehicleManagement integrated
- ✅ Both view modes working
- ✅ CORS bypassed via proxy
- ⚠️ Modal not yet updated to use API (still uses mock data)

---

## 📝 Notes

1. **Development**: Uses `/api` proxy → `https://localhost:7250/api`
2. **Production**: Uses direct URL `https://localhost:7250/api`
3. **Modal**: Currently not using new API, needs update for production use
4. **Hierarchy**: Properly groups models by type and vehicles by model
5. **No breaking changes**: Old mock data still works for backward compatibility
