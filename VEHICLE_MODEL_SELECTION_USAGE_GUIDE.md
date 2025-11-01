# 🚗 Vehicle Model Selection - Quick Start Guide

## Tính năng mới: Hiển thị Loại Xe & Chọn để xem Models

### 📌 Vị trí truy cập

**Staff Sidebar Menu → "Chọn loại xe"**

---

## 🎯 Cách sử dụng

### Bước 1: Đăng nhập

- Đăng nhập với tài khoản staff
- Vào Dashboard staff

### Bước 2: Mở trang "Chọn loại xe"

- Click vào menu "Chọn loại xe" trong sidebar bên trái
- Hoặc nếu không thấy, có thể ở dưới menu "Quản lý xe"

### Bước 3: Chọn loại xe

- **Bên trái**: Danh sách các loại xe (Vehicle Types)
  - Sedan
  - SUV
  - Truck
  - Van
  - Electric
  - Hybrid
  - Motorcycle
  - Convertible
  - Coupe
  - Hatchback
- Click vào bất kỳ loại xe nào để chọn

### Bước 4: Xem danh sách models

- **Bên phải**: Hiển thị các mẫu xe cho loại đã chọn
- Mỗi model card hiển thị:
  - 📛 Tên mẫu (Manufacturer + Model name)
  - 🏭 Thương hiệu (Manufacturer)
  - 📋 Thông số kỹ thuật (Specs)
  - 💰 Giá thuê (Price per hour)
  - 🔘 Nút "Xem xe của mẫu này" (View vehicles of this model)

---

## 🎨 Giao diện

### Layout

```
┌─────────────────────────────────────────────┐
│  Quay lại | Chọn loại xe                    │
│           | Chọn loại xe để xem các mẫu     │
└─────────────────────────────────────────────┘

┌──────────────────┬────────────────────────────┐
│  Loại xe         │  Các mẫu xe: [Type Name]  │
│                  │  [Mô tả type]              │
│ [Type Cards]     │  Số mẫu: X                 │
│ - Active type    │                            │
│   highlighted    │  [Model Card Grid]         │
│                  │  ┌──────┐ ┌──────┐         │
│                  │  │Model1│ │Model2│         │
│                  │  │..    │ │..    │         │
│                  │  └──────┘ └──────┘         │
└──────────────────┴────────────────────────────┘
```

### Màu sắc

- **Primary Color**: #6366f1 (Indigo - Tím xanh)
- **Type Cards**:
  - Mặc định: Xám nhạt
  - Active: Gradient tím xanh
  - Hover: Có border và transform

---

## 💾 Dữ liệu hiển thị

### Loại xe (Vehicle Types)

Được lấy từ API: `GET /api/VehicleType`

**Ví dụ:**

```json
{
  "vehicleTypeId": "f29b49b8-b886-48bf-b58c-37f49b83b76a",
  "typeName": "Sedan",
  "description": "Four-door passenger car",
  "isactive": true
}
```

### Mẫu xe (Vehicle Models)

Được lấy từ API: `GET /api/VehicleModel`

**Ví dụ:**

```json
{
  "vehicleModelId": "0ad1c340-c1c4-4b25-8619-cf8f8fdc066f",
  "typeId": "f29b49b8-b886-48bf-b58c-37f49b83b76a",
  "name": "Camry",
  "manufacturer": "Toyota",
  "pricePerHour": 15.0,
  "specs": "2.5L 4-cylinder",
  "isactive": true
}
```

---

## 🔄 Tương tác

### Click vào Type Card

- ✅ Card được highlight (active state)
- ✅ Indicator dot xuất hiện
- ✅ Models bên phải cập nhật tự động
- ✅ Hiển thị danh sách models cho type đó

### Hover vào Type Card

- ✨ Background nhạt hơn
- ✨ Border highlight
- ✨ Shift phải 4px (transform)

### Hover vào Model Card

- 📤 Card nâng lên (transform translateY)
- 📦 Shadow box mở rộng
- 🎯 Nút "Xem xe" highlight

---

## 🚀 Tính năng Enhanced (có thể thêm)

1. **Click "Xem xe của mẫu này"**

   - Mở danh sách tất cả xe của model đó
   - Hoặc: Chuyển sang trang "Quản lý xe" với filter

2. **Filter/Search**

   - Tìm kiếm loại xe nhanh
   - Filter theo giá

3. **Statistics**
   - Hiển thị số lượng xe của mỗi model
   - Số xe sẵn có

---

## 🐛 Troubleshooting

### Không thấy menu "Chọn loại xe"

- ❌ Kiểm tra đã login là staff chưa
- ✅ Refresh trang (Ctrl+R)
- ✅ Xóa cache và reload

### Không hiển thị dữ liệu

- ❌ Kiểm tra backend API (localhost:7250) có chạy không
- ✅ Check DevTools Console → Xem có error gì
- ✅ Xem Network tab → Kiểm tra API response

### Hiển thị "Không thể tải dữ liệu"

- 🔄 Click nút "Thử lại"
- 🔄 Refresh trang
- 🔄 Kiểm tra internet connection

---

## 📱 Mobile/Responsive

- **Desktop (>1024px)**: 2 column (Types + Models)
- **Tablet (768px-1024px)**: Flexible layout
- **Mobile (<768px)**: Single column, full width

---

## 🎓 Học thêm

### Files liên quan

- Component: `src/pages/Staff/VehicleModelSelection.tsx`
- Styling: `src/pages/Staff/VehicleModelSelection.scss`
- Service: `src/services/vehicleService.ts`
- Routes: `src/App.tsx`

### API Endpoints

- Loại xe: `GET /api/VehicleType`
- Mẫu xe: `GET /api/VehicleModel`
- Xe: `GET /api/Vehicle`

---

## ✅ Checklist

- [x] Component tạo xong
- [x] API integration hoàn tất
- [x] Styling complete
- [x] Responsive design
- [x] Error handling
- [x] Loading states
- [x] Sidebar menu added
- [x] Route configured
- [x] Build success
- [x] No compilation errors

---

**Version**: 1.0  
**Created**: October 24, 2025  
**Status**: ✅ Ready to use
