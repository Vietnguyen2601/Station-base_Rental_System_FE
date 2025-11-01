# 3-Tier Vehicle Management Architecture

## Giới thiệu

Cấu trúc 3 tầng (`VehicleType → VehicleModel → Vehicle`) được triển khai để quản lý xe điện theo một hệ thống phân cấp rõ ràng và dễ bảo trì.

## Cấu trúc Dữ liệu

### Tầng 1: Vehicle Type (Loại Xe)

**Đại diện cho:** Phân loại chính của xe (Sedan, SUV, Hatchback, v.v.)

```typescript
interface VehicleType {
  vehicle_type_id: string; // ID duy nhất (vt-001, vt-002, ...)
  type_name: string; // Tên loại (Sedan, SUV, ...)
  description?: string; // Mô tả chi tiết
  created_at: Date;
  isActive: boolean;
  updated_at?: Date;
}
```

**Ví dụ:**

- Sedan
- SUV
- Hatchback
- Luxury
- Crossover
- Compact

---

### Tầng 2: Vehicle Model (Mẫu Xe)

**Đại diện cho:** Các mẫu cụ thể trong mỗi loại xe (Tesla Model 3, Nissan Leaf, v.v.)

```typescript
interface VehicleModel {
  vehicle_model_id: string; // ID duy nhất (vm-001, vm-002, ...)
  type_id: string; // Liên kết đến VehicleType
  name: string; // Tên mẫu (Model 3, Leaf, ...)
  manufacturer: string; // Hãng sản xuất (Tesla, Nissan, ...)
  price_per_hour: number; // Giá thuê/giờ
  specs?: string; // Thông số kỹ thuật
  created_at: Date;
  isActive: boolean;
  updated_at?: Date;
}
```

**Ví dụ:**

- Tesla Model 3 (Sedan)
- Tesla Model Y (SUV)
- Nissan Leaf (Sedan)
- Hyundai Kona EV (Hatchback)
- BMW i3 (Sedan)

---

### Tầng 3: Vehicle (Xe Cụ Thể)

**Đại diện cho:** Từng chiếc xe vật lý với trạng thái, vị trí, pin, v.v.

```typescript
interface Vehicle {
  vehicle_id: string; // ID duy nhất (v-001, v-002, ...)
  serial_number: string; // Số seri trên xe
  model_id: string; // Liên kết đến VehicleModel
  station_id?: string; // Trạm dừa
  status: "AVAILABLE" | "RENTED" | "MAINTENANCE" | "CHARGING";
  battery_level?: number; // Phần trăm pin (0-100)
  battery_capacity?: number; // Dung lượng pin (kWh)
  range?: number; // Quãng đường có thể đi (km)
  color?: string; // Màu sơn
  last_maintenance?: Date; // Lần bảo trì cuối
  img?: string; // Hình ảnh
  created_at: Date;
  isActive: boolean;
  updated_at?: Date;
}
```

**Ví dụ:**

- Tesla Model 3 #001 (Serial: TM3-2024-001)
- Tesla Model 3 #002 (Serial: TM3-2024-002)
- Nissan Leaf #001 (Serial: NL-2024-001)

---

## Sơ đồ Quan hệ

```
VehicleType (1)
    ↓
    ├──→ VehicleModel (N) [mỗi loại xe có nhiều mẫu]
             ↓
             └──→ Vehicle (N) [mỗi mẫu xe có nhiều chiếc]
```

**Ví dụ cụ thể:**

```
Sedan
├── Tesla Model 3 (25$/h)
│   ├── v-001 (75% pin, Trạm 1)
│   ├── v-002 (92% pin, Trạm 2)
│   └── v-003 (45% pin, Bảo trì)
├── Nissan Leaf (20$/h)
│   ├── v-004 (88% pin, Trạm 1)
│   └── v-005 (12% pin, Sạc)
└── BMW i3 (30$/h)
    └── v-006 (100% pin, Trạm 3)

SUV
└── Tesla Model Y (30$/h)
    ├── v-007 (70% pin, Trạm 2)
    └── v-008 (50% pin, Đang thuê)
```

---

## Component: VehicleHierarchyView

### Chức năng

Component `VehicleHierarchyView` hiển thị danh sách xe theo cấu trúc phân cấp 3 tầng.

### Props

```typescript
interface VehicleHierarchyViewProps {
  vehicles: Vehicle[]; // Danh sách xe để hiển thị
  onSelectVehicle?: (vehicle: Vehicle) => void; // Callback khi chọn xe
  viewMode?: "tree" | "grid"; // Chế độ hiển thị
}
```

### Các chế độ hiển thị

#### 1. Tree View (Cây phân cấp)

- Hiển thị loại xe ở tầng 1
- Nhấp để mở rộng → Hiển thị mẫu xe
- Nhấp để mở rộng → Hiển thị xe cụ thể
- Phù hợp cho xem toàn cảnh

#### 2. Grid View (Lưới)

- Mỗi loại xe là một section
- Mỗi mẫu xe là một subsection
- Các xe cụ thể hiển thị dạng card
- Phù hợp cho xem chi tiết

---

## Tích hợp trong VehicleManagement Page

Page `VehicleManagement` hiện có 2 chế độ:

### 1. Table View (Mặc định)

- Hiển thị danh sách xe dạng grid card
- Hỗ trợ tìm kiếm và lọc theo trạng thái
- Thao tác: Xem chi tiết, Sửa, Xóa

### 2. Hierarchy View (Mới)

- Hiển thị xe theo cấu trúc 3 tầng
- Cho phép mở rộng/thu gọn từng tầng
- Dễ dàng nhìn thấy mối quan hệ type → model → vehicle

### Toggle Button

```
[≡] [🌳]
Table  Hierarchy
```

---

## Lợi ích của Cấu trúc 3 Tầng

1. **Tổ chức rõ ràng**

   - Dễ hiểu mối quan hệ giữa các tầng
   - Không bị nhầm lẫn các mẫu xe

2. **Giảm trùng lặp dữ liệu**

   - Thông tin type chỉ lưu 1 lần
   - Thông tin model chỉ lưu 1 lần

3. **Quản lý dễ hơn**

   - Thêm loại xe → Tự động liên kết tất cả mẫu
   - Thay đổi giá model → Cập nhật cho tất cả xe

4. **Hiệu suất tốt**

   - Có thể load dữ liệu từng tầng khi cần
   - Giảm dung lượng request

5. **Mở rộng dễ dàng**
   - Thêm loại xe mới
   - Thêm mẫu xe mới
   - Thêm xe mới

---

## Các Tác vụ Thường gặp

### Tìm tất cả xe của một loại

```typescript
const sedanCars = vehicles.filter((v) => {
  const model = vehicleModels.find((m) => m.vehicle_model_id === v.model_id);
  return model?.type_id === "vt-001"; // Sedan
});
```

### Tìm tất cả xe của một mẫu

```typescript
const model3Cars = vehicles.filter((v) => v.model_id === "vm-001");
```

### Tính tổng giá thuê của một loại

```typescript
const totalPrice = vehicleTypes.reduce((sum, type) => {
  const models = vehicleModels.filter(
    (m) => m.type_id === type.vehicle_type_id
  );
  const avgPrice =
    models.reduce((s, m) => s + m.price_per_hour, 0) / models.length;
  return sum + avgPrice;
}, 0);
```

---

## Kế tiếp: Phát triển thêm

1. **Quản lý Type**

   - Thêm/Sửa/Xóa loại xe
   - Hiển thị thống kê cho mỗi loại

2. **Quản lý Model**

   - Thêm/Sửa/Xóa mẫu xe
   - Quản lý giá, thông số kỹ thuật

3. **Quản lý Vehicle**

   - Thêm/Sửa/Xóa xe cụ thể
   - Cập nhật trạng thái, pin, vị trí

4. **Báo cáo**
   - Tổng số xe theo loại
   - Tỷ lệ xe khả dụng
   - Doanh thu theo mẫu
