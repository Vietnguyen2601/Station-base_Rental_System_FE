# VehicleHierarchyView Component - Quick Reference

## 📊 Cấu Trúc 3 Tầng

```
┌─────────────────────────────────────────────────────────┐
│               VEHICLE HIERARCHY (3-TIER)               │
└─────────────────────────────────────────────────────────┘

TIER 1: VEHICLE TYPE (Loại Xe)
├─ Sedan
│  ├─ [expand icon] Sedan (6 xe)
│  │
│  └─ TIER 2: VEHICLE MODEL (Mẫu Xe)
│     ├─ Tesla Model 3 (25$/h)
│     │  ├─ [expand icon] 3 xe
│     │  │
│     │  └─ TIER 3: VEHICLE (Xe Cụ Thể)
│     │     ├─ TM3-2024-001 [✓ Có sẵn] [🔋 75%]
│     │     ├─ TM3-2024-002 [✓ Có sẵn] [🔋 92%]
│     │     └─ TM3-2024-003 [🔧 Bảo trì] [🔋 45%]
│     │
│     ├─ Nissan Leaf (20$/h)
│     │  ├─ [expand icon] 2 xe
│     │  └─ NL-2024-001 [✓ Có sẵn] [🔋 88%]
│     │     NL-2024-002 [⚡ Sạc] [🔋 12%]
│     │
│     └─ BMW i3 (30$/h)
│        └─ [expand icon] 1 xe
│           └─ BI3-2024-001 [✓ Có sẵn] [🔋 100%]
│
├─ SUV
│  └─ Tesla Model Y (30$/h)
│     ├─ [expand icon] 2 xe
│     ├─ TMY-2024-001 [✓ Có sẵn] [🔋 70%]
│     └─ TMY-2024-002 [🚗 Đang thuê] [🔋 50%]
│
└─ Hatchback
   └─ Hyundai Kona EV (22$/h)
      └─ [expand icon] 2 xe
         ├─ HKE-2024-001 [✓ Có sẵn] [🔋 88%]
         └─ HKE-2024-002 [✓ Có sẵn] [🔋 95%]
```

---

## 🎨 Hai Chế Độ Hiển Thị

### Mode 1: TREE VIEW

```
[Cây Phân Cấp - Folding UI]
├─ ▼ Sedan (6 xe)
│  ├─ ▼ Tesla Model 3 (25$/h)
│  │  ├─ TM3-2024-001 [✓ 75%]
│  │  ├─ TM3-2024-002 [✓ 92%]
│  │  └─ TM3-2024-003 [🔧 45%]
│  ├─ ▶ Nissan Leaf (20$/h)
│  └─ ▶ BMW i3 (30$/h)
├─ ▶ SUV (2 xe)
└─ ▶ Hatchback (2 xe)
```

**Ưu điểm:**

- Nhìn cây phân cấp đầy đủ
- Mở/Đóng từng mục dễ
- Tiết kiệm không gian màn hình

---

### Mode 2: GRID VIEW

```
[Bảng Lưới - Expanded Grid]

┌────────────────────────────────────────┐
│         SEDAN (6 xe)                   │
├────────────────────────────────────────┤
│ Tesla Model 3 (25$/h)                  │
│ ┌──────┐ ┌──────┐ ┌──────┐            │
│ │ TM3- │ │ TM3- │ │ TM3- │            │
│ │ 001  │ │ 002  │ │ 003  │            │
│ │ ✓75% │ │ ✓92% │ │ 🔧45%│            │
│ └──────┘ └──────┘ └──────┘            │
│                                        │
│ Nissan Leaf (20$/h)                    │
│ ┌──────┐ ┌──────┐                      │
│ │ NL-  │ │ NL-  │                      │
│ │ 001  │ │ 002  │                      │
│ │ ✓88% │ │ ⚡12%│                      │
│ └──────┘ └──────┘                      │
└────────────────────────────────────────┘
```

**Ưu điểm:**

- Nhìn hết tất cả xe
- Dễ so sánh giữa các mẫu
- Nhìn trạng thái từng xe rõ

---

## 📁 File Structure

```
src/components/VehicleHierarchyView/
├── VehicleHierarchyView.tsx          [React Component]
├── VehicleHierarchyView.scss         [Styling]
├── VEHICLE_HIERARCHY.md              [Documentation]
└── README.md                         [This file]
```

---

## 💻 Cách Sử Dụng

### Import Component

```typescript
import VehicleHierarchyView from "../../components/VehicleHierarchyView/VehicleHierarchyView";
```

### Sử Dụng Cơ Bản

```typescript
<VehicleHierarchyView
  vehicles={staffVehicles}
  viewMode="tree"
  onSelectVehicle={(vehicle) => {
    console.log("Chọn xe:", vehicle);
  }}
/>
```

### Props Tùy Chọn

```typescript
interface VehicleHierarchyViewProps {
  vehicles: Vehicle[]; // Bắt buộc: Danh sách xe
  viewMode?: "tree" | "grid"; // Tùy chọn: tree (default)
  onSelectVehicle?: (vehicle: Vehicle) => void; // Tùy chọn: Hàm xử lý
}
```

---

## 🔄 Dòng Dữ Liệu

### Mock Data

```typescript
// Trong vehicleMockData.ts
export const mockVehicleTypes = [...]    // Danh sách loại
export const mockVehicleModels = [...]   // Danh sách mẫu
export const mockVehicles = [...]        // Danh sách xe

// Quan hệ:
// Vehicle.model_id → VehicleModel.vehicle_model_id
// VehicleModel.type_id → VehicleType.vehicle_type_id
```

---

## 🎯 Tích Hợp trong VehicleManagement Page

### Toggle View Mode

```typescript
const [viewMode, setViewMode] = useState<'table' | 'hierarchy'>('table');

{/* Toggle Button */}
<button onClick={() => setViewMode('table')}>≡ Bảng</button>
<button onClick={() => setViewMode('hierarchy')}>🌳 Phân Cấp</button>

{/* Conditional Rendering */}
{viewMode === 'table' ? (
  // Hiển thị view bảng hiện tại
) : (
  // Hiển thị VehicleHierarchyView mới
)}
```

---

## ✨ Features

### Tree View

- ✅ Mở rộng/Thu gọn từng tầng
- ✅ Hiển thị số lượng xe
- ✅ Hiển thị giá/giờ
- ✅ Thông tin trạng thái xe
- ✅ Hiển thị pin, quãng đường
- ✅ Click chọn xe

### Grid View

- ✅ Hiển thị thẻ xe (vehicle card)
- ✅ Hình ảnh/biểu tượng xe
- ✅ Thông tin chi tiết
- ✅ Phân nhóm theo type → model
- ✅ Responsive design

---

## 🎨 Styling

### BEM Methodology

```scss
.vehicle-hierarchy {
  &__tree {
  }
  &__grid {
  }
  &__empty {
  }
}

.hierarchy-type {
}
.hierarchy-type__header {
}
.hierarchy-type__info {
}

.hierarchy-model {
}
.hierarchy-model__header {
}
.hierarchy-model__info {
}

.hierarchy-vehicle {
}
.vehicle-item {
}
.vehicle-item__icon {
}
.vehicle-item__info {
}
```

---

## 📊 Dữ Liệu Example

### VehicleType

```json
{
  "vehicle_type_id": "vt-001",
  "type_name": "Sedan",
  "description": "4-door sedan electric vehicles",
  "isActive": true
}
```

### VehicleModel

```json
{
  "vehicle_model_id": "vm-001",
  "type_id": "vt-001",
  "name": "Model 3",
  "manufacturer": "Tesla",
  "price_per_hour": 25,
  "specs": "250km range, 0-100 in 5.3s"
}
```

### Vehicle

```json
{
  "vehicle_id": "v-001",
  "serial_number": "TM3-2024-001",
  "model_id": "vm-001",
  "status": "AVAILABLE",
  "battery_level": 75,
  "range": 240,
  "color": "Pearl White"
}
```

---

## 🔗 Quan Hệ Dữ Liệu

```
Vehicle (Xe cụ thể)
    ↓ model_id
VehicleModel (Mẫu xe)
    ↓ type_id
VehicleType (Loại xe)
```

---

## 🚀 Tiếp Theo

1. **Thêm CRUD Operations**

   - Tạo form thêm/sửa type, model, vehicle
   - Xóa type, model, vehicle

2. **Thêm Filters**

   - Lọc theo trạng thái
   - Lọc theo trạm
   - Tìm kiếm

3. **Thêm Statistics**

   - Thống kê theo type
   - Thống kê theo model
   - Dashboard

4. **Optimization**
   - Virtual scrolling cho danh sách lớn
   - Caching dữ liệu
   - Lazy loading

---

## 📝 Notes

- Component hiện sử dụng mock data từ `vehicleMockData.ts`
- IDs đều là string (vt-001, vm-001, v-001)
- Hỗ trợ Responsive: Mobile, Tablet, Desktop
- Sử dụng Lucide React icons
- BEM CSS methodology

---

**Created:** 2024 | **Last Updated:** Oct 23, 2024
