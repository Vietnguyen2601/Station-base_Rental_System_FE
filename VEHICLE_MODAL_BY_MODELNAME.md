# Vehicle Modal Organization by ModelName

## 📋 Overview

Vehicles are now organized into modals based on their `modelName` field from the API response. Each distinct `modelName` (e.g., "Ninja", "Model 3", "City Car") gets its own modal showing all vehicles of that model.

## 🔍 API Response Structure

```json
{
  "vehicleId": "34ae4617-a26d-4947-88d7-7c6acea8883a",
  "serialNumber": "SN123464",
  "typeName": "Motorcycle", // ← Type (Motorcycle, Electric, etc.)
  "modelName": "Ninja", // ← Modal identifier (Ninja, Model 3, etc.)
  "manufacturer": "Kawasaki",
  "pricePerHour": 10,
  "batteryLevel": 80,
  "color": "Black",
  "status": "AVAILABLE",
  "lastMaintenance": "2025-09-09",
  "specs": "400cc"
}
```

## 🎯 How It Works

### 1. **Model Selection Flow**

```
User selects Type (Motorcycle)
    ↓
Shows Models of that Type (Ninja, Hayabusa, etc.)
    ↓
User clicks "Xem xe của mẫu này" on a Model (e.g., Ninja)
    ↓
Modal opens with all vehicles where modelName === "Ninja"
```

### 2. **Vehicle Filtering Logic**

**Function:** `getVehiclesForModel(modelName: string)`

```typescript
const getVehiclesForModel = (modelName: string): HierarchyVehicle[] => {
  const matchingVehicles: HierarchyVehicle[] = [];

  // Search through entire hierarchy for matching modelName
  hierarchyData.forEach((type) => {
    type.models.forEach((model) => {
      if (model.name === modelName) {
        matchingVehicles.push(...(model.vehicles || []));
      }
    });
  });

  return matchingVehicles;
};
```

**Logic:**

- Takes `modelName` as parameter (e.g., "Ninja", "Model 3")
- Searches through all type groups
- Finds all models matching that name
- Returns all vehicles in that model group

### 3. **Example Data Mapping**

**API Returns:**

```
Vehicle 1: modelName="Ninja", serialNumber="SN123464", color="Black"
Vehicle 2: modelName="Ninja", serialNumber="SN123465", color="Red"
Vehicle 3: modelName="Model 3", serialNumber="SN123458", color="White"
Vehicle 4: modelName="Model 3", serialNumber="SN123459", color="Silver"
```

**Modal Organization:**

```
Modal 1 (modelName="Ninja")
  ├─ Vehicle: SN123464, Black
  └─ Vehicle: SN123465, Red

Modal 2 (modelName="Model 3")
  ├─ Vehicle: SN123458, White
  └─ Vehicle: SN123459, Silver
```

## 📊 Vehicle Modal Display

When user clicks "Xem xe" for a model, the modal shows:

```
┌─────────────────────────────────────┐
│ Xe của mẫu: Kawasaki Ninja (2 chiếc)|
└─────────────────────────────────────┘
│ ┌─────────────────────────────────┐ │
│ │ [Image] SN123464                │ │
│ │         Black | 80% | 300km     │ │
│ │         Bảo trì: 2025-09-09     │ │
│ │         Status: Có sẵn          │ │
│ └─────────────────────────────────┘ │
│ ┌─────────────────────────────────┐ │
│ │ [Image] SN123465                │ │
│ │         Red | 85% | 320km       │ │
│ │         Bảo trì: 2025-09-10     │ │
│ │         Status: Đang được thuê   │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🔄 Data Flow Diagram

```
┌─────────────────┐
│  Get Vehicles   │ ← API: /api/Vehicle
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ buildHierarchyData()                │
│ Groups by typeName + modelName      │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ HierarchyVehicleType[]              │
│ [{                                  │
│   id: "Motorcycle",                 │
│   models: [{                        │
│     name: "Ninja",                  │
│     vehicles: [...]  ← All Ninjas   │
│   }, ...]                           │
│ }, ...]                             │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ getVehiclesForModel("Ninja")        │
│ ↓ searches for modelName="Ninja"    │
│ ↓ returns all Ninja vehicles        │
└────────┬────────────────────────────┘
         │
         ↓
┌─────────────────────────────────────┐
│ setSelectedModel({                  │
│   modelName: "Ninja",               │
│   vehicles: [...]                   │
│ })                                  │
│ ↓ Open modal with Ninja vehicles    │
└─────────────────────────────────────┘
```

## 📝 Implementation Details

### Updated Function: `getVehiclesForModel`

**Previous:** Searched by modelId (didn't work with flat API)

**Current:** Searches by modelName (matches API response)

```typescript
// BEFORE: ❌
const getVehiclesForModel = (modelId: string) => {
  const type = hierarchyData.find((t) => t.id === selectedTypeId);
  const model = type.models.find((m) => m.id === modelId);
  return model?.vehicles || [];
};

// AFTER: ✅
const getVehiclesForModel = (modelName: string): HierarchyVehicle[] => {
  const matchingVehicles: HierarchyVehicle[] = [];
  hierarchyData.forEach((type) => {
    type.models.forEach((model) => {
      if (model.name === modelName) {
        matchingVehicles.push(...(model.vehicles || []));
      }
    });
  });
  return matchingVehicles;
};
```

### Updated Handler: `handleViewVehicles`

```typescript
const handleViewVehicles = (model: VehicleModel) => {
  const vehicles = getVehiclesForModel(model.name); // ← Use modelName
  setSelectedModel({
    modelId: model.vehicleModelId,
    modelName: model.name,
    manufacturer: model.manufacturer,
    vehicles, // ← All vehicles with matching modelName
  });
};
```

## ✅ Benefits

1. **Correct Grouping**: Vehicles grouped by actual `modelName` from API
2. **Flexible Matching**: Works with any number of vehicles per model
3. **Type-Safe**: TypeScript ensures correct types
4. **Efficient**: Single pass through hierarchy to find matches
5. **User-Friendly**: Users see all vehicles of selected model in one modal

## 🧪 Testing

To verify the feature works:

1. Open browser DevTools → Network tab
2. Click a Type → See Models
3. Click "Xem xe" on a Model
4. Check modal shows vehicles with matching `modelName`
5. Verify vehicle details (color, battery, status, etc.)

## 📌 Example Scenarios

### Scenario 1: Motorcycle Type → Ninja Model

```
API Data:
  ✓ SN123464 (modelName: "Ninja")
  ✓ SN123465 (modelName: "Ninja")
  ✗ SN123458 (modelName: "Hayabusa") ← Different model

Result: Modal shows SN123464 + SN123465 (2 vehicles)
```

### Scenario 2: Electric Type → Model 3 Model

```
API Data:
  ✓ SN123458 (modelName: "Model 3", batteryLevel: 80)
  ✓ SN123459 (modelName: "Model 3", batteryLevel: 75)
  ✗ SN123460 (modelName: "Model S") ← Different model

Result: Modal shows SN123458 + SN123459 (2 vehicles)
```

## 🚀 Summary

The vehicle modal system now correctly:

- 📍 Uses `modelName` as the identifier for modal grouping
- 🔍 Finds all vehicles matching the selected model
- 📋 Displays them in a single comprehensive modal
- ✨ Shows vehicle details: serial, color, battery, range, status
