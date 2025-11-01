# 3-Tier Vehicle Management Architecture - Visual Diagrams

## 1. Cấu Trúc Dữ Liệu Phân Cấp

```
┌─────────────────────────────────────────────────────────────────┐
│                   3-TIER HIERARCHY STRUCTURE                    │
└─────────────────────────────────────────────────────────────────┘

         TIER 1: VEHICLE TYPE
         ┌────────────────────┐
         │   Loại Xe (Type)   │
         ├────────────────────┤
         │ - Sedan            │
         │ - SUV              │
         │ - Hatchback        │
         │ - Luxury           │
         │ - Crossover        │
         │ - Compact          │
         └────────┬───────────┘
                  │
                  │ (1 loại : N mẫu)
                  ▼
         TIER 2: VEHICLE MODEL
         ┌────────────────────┐
         │  Mẫu Xe (Model)    │
         ├────────────────────┤
         │ - Tesla Model 3    │
         │ - Tesla Model Y    │
         │ - Nissan Leaf      │
         │ - Hyundai Kona EV  │
         │ - BMW i3           │
         └────────┬───────────┘
                  │
                  │ (1 mẫu : N xe)
                  ▼
         TIER 3: VEHICLE
         ┌────────────────────┐
         │ Xe Cụ Thể (Unit)   │
         ├────────────────────┤
         │ - Xe #001          │
         │ - Xe #002          │
         │ - Xe #003          │
         │ - Xe #004          │
         │ - Xe #005          │
         └────────────────────┘
```

---

## 2. Entity Relationship Diagram

```
┌─────────────────────────┐
│    VEHICLE_TYPE         │
├─────────────────────────┤
│ PK: vehicle_type_id     │
│    type_name            │
│    description          │
│    isActive             │
└────────────┬────────────┘
             │
             │ 1:N
             │
             ▼
┌─────────────────────────┐
│   VEHICLE_MODEL         │
├─────────────────────────┤
│ PK: vehicle_model_id    │
│ FK: type_id ──────────┐ │
│    name                 │ │
│    manufacturer         │ │ (relates to VEHICLE_TYPE)
│    price_per_hour       │ │
│    specs                │ │
│    isActive             │ │
└────────────┬────────────┘
             │
             │ 1:N
             │
             ▼
┌─────────────────────────┐
│    VEHICLE              │
├─────────────────────────┤
│ PK: vehicle_id          │
│ FK: model_id ──────────┐ │
│    serial_number        │ │ (relates to VEHICLE_MODEL)
│    station_id           │ │
│    status               │ │
│    battery_level        │ │
│    range                │ │
│    color                │ │
│    isActive             │ │
└─────────────────────────┘
```

---

## 3. Ví Dụ Dữ Liệu Cụ Thể

```
┌─────────────────────────────────────────────────────────────┐
│                    EXAMPLE HIERARCHY                        │
└─────────────────────────────────────────────────────────────┘

[SEDAN] (Type ID: vt-001)
│
├─── [Tesla Model 3] (Model ID: vm-001) - $25/h
│    ├─ v-001: TM3-2024-001 ✓ 75% 📍 240km
│    ├─ v-002: TM3-2024-002 ✓ 92% 📍 300km
│    └─ v-003: TM3-2024-003 🔧 45% 📍 180km
│
├─── [Nissan Leaf] (Model ID: vm-002) - $20/h
│    ├─ v-004: NL-2024-001 ✓ 88% 📍 280km
│    └─ v-005: NL-2024-002 ⚡ 12% 📍 50km
│
└─── [BMW i3] (Model ID: vm-004) - $30/h
     └─ v-006: BI3-2024-001 ✓ 100% 📍 300km

[SUV] (Type ID: vt-002)
│
└─── [Tesla Model Y] (Model ID: vm-003) - $30/h
     ├─ v-007: TMY-2024-001 ✓ 70% 📍 350km
     └─ v-008: TMY-2024-002 🚗 50% 📍 250km

[HATCHBACK] (Type ID: vt-003)
│
└─── [Hyundai Kona EV] (Model ID: vm-005) - $22/h
     ├─ v-009: HKE-2024-001 ✓ 88% 📍 320km
     └─ v-010: HKE-2024-002 ✓ 95% 📍 350km

Legend: ✓=Available | 🚗=Rented | 🔧=Maintenance | ⚡=Charging
```

---

## 4. Dòng Dữ Liệu (Data Flow)

```
┌──────────────────────────────────────────────────────────┐
│              COMPONENT DATA FLOW                         │
└──────────────────────────────────────────────────────────┘

USER INTERACTION
    ↓
VehicleManagement Page
    ├─ Toggle Button: "Table" ↔ "Hierarchy"
    │       ↓
    ├─ TableView (Grid of Vehicles)
    │
    └─ HierarchyView Component
        │
        ├─ Input: vehicles[] array
        │       ↓
        ├─ Process:
        │   1. Read vehicleMockData.ts
        │   2. Group vehicles by model_id
        │   3. Group models by type_id
        │   4. Build hierarchy structure
        │       ↓
        ├─ State Management:
        │   - expanded.types: Record<string, boolean>
        │   - expanded.models: Record<string, boolean>
        │       ↓
        └─ Render:
            ├─ TreeView (if viewMode='tree')
            │   └─ Collapsible tree structure
            │
            └─ GridView (if viewMode='grid')
                └─ Grid of model sections
```

---

## 5. Component Communication

```
VehicleManagement (Parent)
├─ State:
│  ├─ viewMode: 'table' | 'hierarchy'
│  ├─ statusFilter: Vehicle['status'] | 'ALL'
│  ├─ searchQuery: string
│  └─ isModalOpen: boolean
│
├─ Child: Table View (conditional)
│  ├─ StatsCards
│  ├─ FilterControls
│  └─ VehicleGrid
│
└─ Child: VehicleHierarchyView (conditional)
   ├─ Props:
   │  ├─ vehicles (filtered)
   │  ├─ viewMode ('tree')
   │  └─ onSelectVehicle callback
   │
   └─ State:
      ├─ expanded.types
      └─ expanded.models
```

---

## 6. UI Layout Comparison

### Tree View Layout

```
┌─────────────────────────────────────────────────┐
│ ▼ Sedan (6 xe)                  [vehicles]      │
├─────────────────────────────────────────────────┤
│   ▼ Tesla Model 3 (25$/h) - 3 xe                │
│   ├─ TM3-2024-001 [✓ 75%] 📍 240km             │
│   ├─ TM3-2024-002 [✓ 92%] 📍 300km             │
│   └─ TM3-2024-003 [🔧 45%] 📍 180km            │
│   ▶ Nissan Leaf (20$/h) - 2 xe                 │
│   ▶ BMW i3 (30$/h) - 1 xe                      │
├─────────────────────────────────────────────────┤
│ ▶ SUV (2 xe)                                   │
├─────────────────────────────────────────────────┤
│ ▶ Hatchback (2 xe)                             │
└─────────────────────────────────────────────────┘
```

### Grid View Layout

```
┌─────────────────────────────────────────────────┐
│                    SEDAN (6 xe)                 │
├─────────────────────────────────────────────────┤
│ Tesla Model 3 (25$/h)                           │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │  TM3-001 │ │  TM3-002 │ │  TM3-003 │        │
│ │   ✓75%   │ │   ✓92%   │ │   🔧45%  │        │
│ │  240km   │ │  300km   │ │  180km   │        │
│ └──────────┘ └──────────┘ └──────────┘        │
│                                                 │
│ Nissan Leaf (20$/h)                            │
│ ┌──────────┐ ┌──────────┐                      │
│ │  NL-001  │ │  NL-002  │                      │
│ │   ✓88%   │ │   ⚡12%   │                      │
│ │  280km   │ │   50km   │                      │
│ └──────────┘ └──────────┘                      │
└─────────────────────────────────────────────────┘
```

---

## 7. State Management

### VehicleManagement Page State

```typescript
const [searchQuery, setSearchQuery] = useState("");
// "Model 3", "Nissan", etc.

const [statusFilter, setStatusFilter] = useState<"ALL" | Status>("ALL");
// ALL, AVAILABLE, RENTED, MAINTENANCE, CHARGING

const [viewMode, setViewMode] = useState<"table" | "hierarchy">("table");
// Toggle between views

const [selectedStation] = useState("1");
// Staff's assigned station
```

### VehicleHierarchyView State

```typescript
const [expanded, setExpanded] = useState<ExpandedState>({
  types: {}, // Record<type_id, boolean>
  models: {}, // Record<model_id, boolean>
});
// Tracks which sections are expanded

const hierarchyData = useMemo(() => {
  // Build hierarchy structure from vehicles array
  // Groups: Type -> Model -> Vehicles
}, [vehicles]);
```

---

## 8. Process Flow: Building Hierarchy

```
Input: vehicles[] array
    ↓
Step 1: For each vehicle
    ├─ Find its VehicleModel (by model_id)
    ├─ Find its VehicleType (by model.type_id)
    └─ Store in hierarchyMap
    ↓
Step 2: Build Map Structure
    ├─ typeMap: Map<type_id, Map<model_id, Vehicle[]>>
    └─ Organize 3 levels
    ↓
Step 3: Convert to Array
    ├─ hierarchyData: Array<TypeData>
    ├─ Each TypeData has:
    │  ├─ type: VehicleType
    │  └─ models: Array<ModelData>
    │     ├─ model: VehicleModel
    │     └─ vehicles: Vehicle[]
    └─ Ready to render
```

---

## 9. Click Interactions

```
USER CLICKS ON:

1. Type Header
   ├─ Toggle expanded.types[type_id]
   ├─ Show/Hide all models of that type
   └─ Display count of vehicles

2. Model Header
   ├─ Toggle expanded.models[model_id]
   ├─ Show/Hide all vehicles of that model
   └─ Display manufacturer & price

3. Vehicle Item
   ├─ Call onSelectVehicle(vehicle)
   ├─ Highlight selected item
   └─ Optional: Open detail modal
```

---

## 10. Responsive Breakpoints

```
DESKTOP (1200px+)
├─ Full tree with all details
└─ Multiple columns in grid

TABLET (768px - 1199px)
├─ Adjusted spacing
├─ Shorter tree item labels
└─ Fewer grid columns

MOBILE (< 768px)
├─ Single column tree
├─ Smaller icons
├─ Reduced padding
├─ Touch-friendly targets (≥44px)
└─ Full width grid items
```

---

## 11. Performance Considerations

```
Optimization Strategies:

1. Memoization
   └─ hierarchyData = useMemo(() => {...}, [vehicles])
   └─ Only recalculate when vehicles change

2. Lazy Expansion
   └─ Only render expanded sections
   └─ Collapsed sections hidden with CSS

3. Key Optimization
   └─ key={vehicle.vehicle_id}
   └─ Prevents unnecessary re-renders

4. Future Optimization
   ├─ Virtual scrolling (react-window)
   ├─ Pagination
   └─ Caching with Redux/Zustand
```

---

## 12. Error Handling

```
Edge Cases:

1. Vehicle without Model
   └─ Filter out during grouping
   └─ Display empty state

2. Model without Type
   └─ Skip in hierarchy
   └─ Log error

3. Empty Hierarchy
   └─ Show "Không có xe nào" message
   └─ Display empty state component

4. Filtering/Searching
   └─ Apply before hierarchy building
   └─ Show filtered results in structure
```

---

## Summary Table

| Layer      | Entity       | Purpose    | Example                |
| ---------- | ------------ | ---------- | ---------------------- |
| **Tier 1** | VehicleType  | Classify   | Sedan, SUV, Hatchback  |
| **Tier 2** | VehicleModel | Specify    | Model 3, Leaf, Kona EV |
| **Tier 3** | Vehicle      | Individual | Unit #001, Unit #002   |

---

**Diagrams created for:** VehicleHierarchyView Component
**Date:** October 23, 2024
**Status:** ✅ Ready for Implementation
