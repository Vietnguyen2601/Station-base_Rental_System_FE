import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Car,
  Battery,
  MapPin,
  Wrench,
  Zap,
  CheckCircle,
  AlertCircle,
  Search,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  GitBranch,
  LayoutGrid,
  SlidersHorizontal,
  Plus,
  X,
} from 'lucide-react';
import {
  vehicleService,
  stationService,
  HierarchyVehicleType,
  VehicleType as ApiVehicleType,
  VehicleModel as ApiVehicleModel,
  StationRecord,
  Vehicle as ApiVehicleDetail,
} from '../../services';
import CloudinaryImage from '../../components/common/CloudinaryImage/CloudinaryImage';
import { uploadVehicleImage } from '../../utils/cloudinary';
import VehicleHierarchyView from '../../components/VehicleHierarchyView/VehicleHierarchyView';
import { Vehicle } from '../../types';
import './VehicleManagement.scss';

interface VehicleManagementProps {
  onBack?: () => void;
}

interface FlatVehicle extends Vehicle {
  model_name: string;
  manufacturer: string;
  type_name: string;
  type_id: string;
  price_per_hour: number;
}

type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'CHARGING';
type StatusFilter = 'ALL' | VehicleStatus;
type ViewMode = 'table' | 'hierarchy';

interface VehicleTypeFormState {
  typeName: string;
  description: string;
}

interface VehicleModelFormState {
  typeId: string;
  name: string;
  manufacturer: string;
  pricePerHour: string;
  specs: string;
}

interface VehicleFormState {
  modelId: string;
  stationId: string;
  serialNumber: string;
  status: VehicleStatus;
  color: string;
  batteryLevel: string;
  batteryCapacity: string;
  range: string;
  img: string;
  lastMaintenance: string;
  isActive: boolean;
}

const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: 'Có sẵn',
  RENTED: 'Đang được thuê',
  MAINTENANCE: 'Bảo trì',
  CHARGING: 'Đang sạc',
};

const STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: STATUS_LABELS.AVAILABLE, value: 'AVAILABLE' },
  { label: STATUS_LABELS.RENTED, value: 'RENTED' },
  { label: STATUS_LABELS.MAINTENANCE, value: 'MAINTENANCE' },
  { label: STATUS_LABELS.CHARGING, value: 'CHARGING' },
];

const VEHICLE_STATUS_OPTIONS: VehicleStatus[] = [
  'AVAILABLE',
  'RENTED',
  'MAINTENANCE',
  'CHARGING',
];

const formatNumber = (value: number) => value.toLocaleString('vi-VN');

interface ManagementModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const ManagementModal: React.FC<ManagementModalProps> = ({ title, onClose, children }) => (
  <div
    className="vehicle-management__modal-overlay"
    onClick={onClose}
    role="dialog"
    aria-modal="true"
  >
    <div
      className="vehicle-management__modal"
      onClick={(event) => event.stopPropagation()}
      role="document"
    >
      <div className="vehicle-management__modal-header">
        <h2>{title}</h2>
        <button
          type="button"
          className="vehicle-management__modal-close"
          onClick={onClose}
          aria-label="Đóng"
        >
          <X size={18} aria-hidden />
        </button>
      </div>
      <div className="vehicle-management__modal-body">{children}</div>
    </div>
  </div>
);

const VehicleManagement: React.FC<VehicleManagementProps> = ({ onBack }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [hierarchyData, setHierarchyData] = useState<HierarchyVehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vehicleTypes, setVehicleTypes] = useState<ApiVehicleType[]>([]);
  const [vehicleModels, setVehicleModels] = useState<ApiVehicleModel[]>([]);
  const [stations, setStations] = useState<StationRecord[]>([]);
  const [typeForm, setTypeForm] = useState<VehicleTypeFormState>({
    typeName: '',
    description: '',
  });
  const [modelForm, setModelForm] = useState<VehicleModelFormState>({
    typeId: '',
    name: '',
    manufacturer: '',
    pricePerHour: '',
    specs: '',
  });
  const [vehicleForm, setVehicleForm] = useState<VehicleFormState>({
    modelId: '',
    stationId: '',
    serialNumber: '',
    status: 'AVAILABLE',
    color: '',
    batteryLevel: '',
    batteryCapacity: '',
    range: '',
    img: '',
    lastMaintenance: '',
    isActive: true,
  });
  const [vehicleModalMode, setVehicleModalMode] = useState<'create' | 'edit'>('create');
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [typeSubmitting, setTypeSubmitting] = useState(false);
  const [modelSubmitting, setModelSubmitting] = useState(false);
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [typeFormError, setTypeFormError] = useState<string | null>(null);
  const [modelFormError, setModelFormError] = useState<string | null>(null);
  const [vehicleFormError, setVehicleFormError] = useState<string | null>(null);
  const [vehicleFormSuccess, setVehicleFormSuccess] = useState<string | null>(null);
  const [imageUploadStatus, setImageUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null);
  const [vehicleDetailLoading, setVehicleDetailLoading] = useState(false);

  const imagePreviewSrc = useMemo(() => vehicleForm.img.trim(), [vehicleForm.img]);
  const vehiclePreviewAlt = useMemo(() => {
    const serial = vehicleForm.serialNumber.trim();
    return serial ? `Xem trước xe ${serial}` : 'Xem trước xe';
  }, [vehicleForm.serialNumber]);
  const isImageUploading = imageUploadStatus === 'uploading';

  const resetVehicleImageState = useCallback(() => {
    setImageUploadStatus('idle');
    setImageUploadError(null);
    setUploadedFileName(null);
  }, []);

  const activeVehicleTypes = useMemo(
    () => vehicleTypes.filter((type) => type.isactive),
    [vehicleTypes]
  );

  const activeVehicleModels = useMemo(
    () => vehicleModels.filter((model) => model.isactive),
    [vehicleModels]
  );

  const activeStations = useMemo(
    () => stations.filter((station) => station.isactive),
    [stations]
  );

  const mapDetailToFormState = useCallback(
    (detail: ApiVehicleDetail): VehicleFormState => {
      const resolvedModelId =
        detail.modelId ??
        vehicleModels.find((model) => model.name === detail.modelName)?.vehicleModelId ??
        activeVehicleModels[0]?.vehicleModelId ??
        '';

      const resolvedStationId =
        detail.stationId ??
        stations.find((station) => station.name === detail.stationName)?.stationId ??
        activeStations[0]?.stationId ??
        '';

      const normalizedStatus = VEHICLE_STATUS_OPTIONS.includes(detail.status as VehicleStatus)
        ? (detail.status as VehicleStatus)
        : 'AVAILABLE';

      return {
        modelId: resolvedModelId,
        stationId: resolvedStationId ?? '',
        serialNumber: detail.serialNumber ?? '',
        status: normalizedStatus,
        color: detail.color ?? '',
        batteryLevel: detail.batteryLevel != null ? String(detail.batteryLevel) : '',
        batteryCapacity: detail.batteryCapacity != null ? String(detail.batteryCapacity) : '',
        range: detail.range != null ? String(detail.range) : '',
        img: detail.img ?? '',
        lastMaintenance: detail.lastMaintenance ? detail.lastMaintenance.slice(0, 10) : '',
        isActive: detail.isactive ?? detail.isActive ?? true,
      };
    },
    [activeStations, activeVehicleModels, stations, vehicleModels]
  );

  const fetchHierarchyData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await vehicleService.buildHierarchyData();
      setHierarchyData(data);
    } catch {
      setError('Không thể tải dữ liệu xe. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchReferenceData = useCallback(async () => {
    try {
      const [types, models, stationList] = await Promise.all([
        vehicleService.getVehicleTypes(),
        vehicleService.getVehicleModels(),
        stationService.getStations(),
      ]);
      setVehicleTypes(types);
      setVehicleModels(models);
      setStations(stationList);
    } catch (err) {
      console.error('Không thể tải dữ liệu tham chiếu xe:', err);
    }
  }, []);

  useEffect(() => {
    fetchHierarchyData();
  }, [fetchHierarchyData]);

  useEffect(() => {
    fetchReferenceData();
  }, [fetchReferenceData]);

  // Build flat vehicle list from hierarchy for backward compatibility with existing filters
  const allVehicles = useMemo(() => {
    const vehicles: FlatVehicle[] = [];
    hierarchyData.forEach((type) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type.models.forEach((model: any) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        model.vehicles.forEach((vehicle: any) => {
          vehicles.push({
            vehicle_id: vehicle.id,
            model_id: model.id,
            type_id: type.id,
            serial_number: vehicle.serialNumber,
            status: vehicle.status,
            battery_level: vehicle.batteryLevel || 0,
            range: vehicle.range || 0,
            color: vehicle.color || 'Unknown',
            last_maintenance: vehicle.lastMaintenance ? new Date(vehicle.lastMaintenance) : undefined,
            img: vehicle.img,
            model_name: model.name,
            manufacturer: model.manufacturer,
            type_name: type.name,
            price_per_hour: model.pricePerHour,
            created_at: new Date(),
            isActive: true,
            updated_at: undefined,
          } as FlatVehicle);
        });
      });
    });
    return vehicles;
  }, [hierarchyData]);

  // Filter vehicles based on search and status
  const filteredVehicles = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    
    return allVehicles.filter(vehicle => {
      const matchesSearch = 
        normalizedQuery === '' ||
        vehicle.serial_number.toLowerCase().includes(normalizedQuery) ||
        vehicle.model_name.toLowerCase().includes(normalizedQuery) ||
        vehicle.manufacturer.toLowerCase().includes(normalizedQuery) ||
        vehicle.type_name.toLowerCase().includes(normalizedQuery);

      const matchesStatus = statusFilter === 'ALL' || vehicle.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [allVehicles, searchQuery, statusFilter]);

  const getStatusIcon = (status: VehicleStatus | string) => {
    switch (status) {
      case 'AVAILABLE':
        return <CheckCircle size={16} className="status-icon status-icon--available" aria-hidden />;
      case 'RENTED':
        return <Car size={16} className="status-icon status-icon--rented" aria-hidden />;
      case 'MAINTENANCE':
        return <Wrench size={16} className="status-icon status-icon--maintenance" aria-hidden />;
      case 'CHARGING':
        return <Zap size={16} className="status-icon status-icon--charging" aria-hidden />;
      default:
        return <AlertCircle size={16} className="status-icon" />;
    }
  };

  const getStatusText = (status: VehicleStatus | string) => STATUS_LABELS[status as VehicleStatus] ?? status;

  const getBatteryColor = (level: number) => {
    if (level >= 70) return 'success';
    if (level >= 30) return 'warning';
    if (level > 0) return 'warning';
    return 'error';
  };

    const openTypeModal = () => {
      setTypeForm({ typeName: '', description: '' });
      setTypeFormError(null);
      setIsTypeModalOpen(true);
    };

    const openModelModal = () => {
      setModelForm({
        typeId: activeVehicleTypes[0]?.vehicleTypeId ?? '',
        name: '',
        manufacturer: '',
        pricePerHour: '',
        specs: '',
      });
      setModelFormError(null);
      setIsModelModalOpen(true);
    };

    const openCreateVehicleModal = () => {
      setVehicleModalMode('create');
      setEditingVehicleId(null);
      setVehicleForm({
        modelId: activeVehicleModels[0]?.vehicleModelId ?? '',
        stationId: activeStations[0]?.stationId ?? '',
        serialNumber: '',
        status: 'AVAILABLE',
        color: '',
        batteryLevel: '',
        batteryCapacity: '',
        range: '',
        img: '',
        lastMaintenance: '',
        isActive: true,
      });
      setVehicleFormError(null);
      setVehicleFormSuccess(null);
      resetVehicleImageState();
      setIsVehicleModalOpen(true);
    };

    const openEditVehicleModal = async (vehicleId: string) => {
      setVehicleModalMode('edit');
      setEditingVehicleId(vehicleId);
      setVehicleFormError(null);
      setVehicleFormSuccess(null);
      resetVehicleImageState();
      setVehicleDetailLoading(true);
      setVehicleForm({
        modelId: '',
        stationId: '',
        serialNumber: '',
        status: 'AVAILABLE',
        color: '',
        batteryLevel: '',
        batteryCapacity: '',
        range: '',
        img: '',
        lastMaintenance: '',
        isActive: true,
      });
      setIsVehicleModalOpen(true);

      try {
        const detail = await vehicleService.getVehicleById(vehicleId);
        setVehicleForm(mapDetailToFormState(detail));
      } catch (err) {
        console.error('Không thể tải thông tin xe:', err);
        setVehicleFormError('Không thể tải thông tin xe để chỉnh sửa. Vui lòng thử lại.');
      } finally {
        setVehicleDetailLoading(false);
      }
    };

    const closeTypeModal = () => {
      if (typeSubmitting) {
        return;
      }
      setIsTypeModalOpen(false);
      setTypeFormError(null);
    };

    const closeModelModal = () => {
      if (modelSubmitting) {
        return;
      }
      setIsModelModalOpen(false);
      setModelFormError(null);
    };

    const closeVehicleModal = () => {
      if (vehicleSubmitting) {
        return;
      }
      setIsVehicleModalOpen(false);
      setVehicleFormError(null);
      setVehicleFormSuccess(null);
      setVehicleModalMode('create');
      setEditingVehicleId(null);
      setVehicleDetailLoading(false);
      resetVehicleImageState();
    };

    const handleSubmitType = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmedName = typeForm.typeName.trim();
      if (!trimmedName) {
        setTypeFormError('Vui lòng nhập tên loại xe.');
        return;
      }

      setTypeSubmitting(true);
      setTypeFormError(null);

      try {
        await vehicleService.createVehicleType({
          typeName: trimmedName,
          description: typeForm.description.trim(),
        });
        await fetchReferenceData();
        await fetchHierarchyData();
        setTypeForm({ typeName: '', description: '' });
        setIsTypeModalOpen(false);
      } catch (err) {
        console.error('Failed to create vehicle type:', err);
        setTypeFormError('Không thể tạo loại xe. Vui lòng thử lại.');
      } finally {
        setTypeSubmitting(false);
      }
    };

    const handleSubmitModel = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!modelForm.typeId) {
        setModelFormError('Vui lòng chọn loại xe.');
        return;
      }

      const trimmedName = modelForm.name.trim();
      const trimmedManufacturer = modelForm.manufacturer.trim();
      if (!trimmedName || !trimmedManufacturer) {
        setModelFormError('Vui lòng nhập đầy đủ thông tin mẫu xe.');
        return;
      }

      const price = Number(modelForm.pricePerHour);
      if (Number.isNaN(price) || price <= 0) {
        setModelFormError('Giá thuê phải là số lớn hơn 0.');
        return;
      }

      setModelSubmitting(true);
      setModelFormError(null);

      try {
        await vehicleService.createVehicleModel({
          typeId: modelForm.typeId,
          name: trimmedName,
          manufacturer: trimmedManufacturer,
          pricePerHour: price,
          specs: modelForm.specs.trim(),
        });
        await fetchReferenceData();
        await fetchHierarchyData();
        setModelForm({
          typeId: activeVehicleTypes[0]?.vehicleTypeId ?? '',
          name: '',
          manufacturer: '',
          pricePerHour: '',
          specs: '',
        });
        setIsModelModalOpen(false);
      } catch (err) {
        console.error('Failed to create vehicle model:', err);
        setModelFormError('Không thể tạo mẫu xe. Vui lòng thử lại.');
      } finally {
        setModelSubmitting(false);
      }
    };

    const handleVehicleImageValueChange = (value: string) => {
      if (imageUploadStatus === 'uploading') {
        return;
      }
      setVehicleForm((prev) => ({ ...prev, img: value }));
      setUploadedFileName(null);
      setImageUploadStatus('idle');
      setImageUploadError(null);
    };

    const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) {
        return;
      }

      if (isImageUploading) {
        event.target.value = '';
        return;
      }

      setVehicleForm((prev) => ({ ...prev, img: '' }));
      setUploadedFileName(file.name);
      setImageUploadStatus('uploading');
      setImageUploadError(null);

      try {
        const { publicId } = await uploadVehicleImage(file);
        setVehicleForm((prev) => ({ ...prev, img: publicId }));
        setImageUploadStatus('success');
      } catch (err) {
        console.error('Không thể tải ảnh lên Cloudinary:', err);
        setImageUploadStatus('error');
        setImageUploadError(
          err instanceof Error ? err.message : 'Không thể tải ảnh lên. Vui lòng thử lại.'
        );
      } finally {
        event.target.value = '';
      }
    };

    const handleSubmitVehicle = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!vehicleForm.modelId) {
        setVehicleFormError('Vui lòng chọn mẫu xe.');
        return;
      }

      if (isImageUploading) {
        setVehicleFormError('Vui lòng chờ ảnh tải lên hoàn tất.');
        return;
      }

      const trimmedSerial = vehicleForm.serialNumber.trim();
      if (!trimmedSerial) {
        setVehicleFormError('Vui lòng nhập số serial của xe.');
        return;
      }

      const trimmedImage = vehicleForm.img.trim();
      if (!trimmedImage) {
        setVehicleFormError('Vui lòng cung cấp hình ảnh cho xe.');
        return;
      }

      const parseNumberField = (value: string, fieldLabel: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return undefined;
        }
        const parsed = Number(trimmed);
        if (Number.isNaN(parsed)) {
          throw new Error(`${fieldLabel} phải là số hợp lệ.`);
        }
        return parsed;
      };

      setVehicleSubmitting(true);
      setVehicleFormError(null);
      setVehicleFormSuccess(null);

      try {
        const payload = {
          modelId: vehicleForm.modelId,
          stationId: vehicleForm.stationId.trim() || undefined,
          serialNumber: trimmedSerial,
          status: vehicleForm.status,
          color: vehicleForm.color.trim() || undefined,
          img: trimmedImage,
          batteryLevel: parseNumberField(vehicleForm.batteryLevel, 'Mức pin'),
          batteryCapacity: parseNumberField(vehicleForm.batteryCapacity, 'Dung lượng pin'),
          range: parseNumberField(vehicleForm.range, 'Quãng đường'),
          lastMaintenance: vehicleForm.lastMaintenance || undefined,
          isactive: vehicleForm.isActive,
        };

        if (vehicleModalMode === 'edit' && editingVehicleId) {
          const updatePayload = {
            ...payload,
            modelId: payload.modelId,
            stationId: payload.stationId ?? null,
            color: payload.color ?? null,
            img: payload.img ?? null,
            lastMaintenance: payload.lastMaintenance ?? null,
          };

          await vehicleService.updateVehicle(editingVehicleId, updatePayload);
          setVehicleFormSuccess('Đã cập nhật thông tin xe thành công.');
        } else {
          await vehicleService.createVehicle(payload);
          setVehicleFormSuccess('Đã thêm xe mới thành công.');
        }

        await fetchReferenceData();
        await fetchHierarchyData();

        if (vehicleModalMode === 'create') {
          setVehicleForm({
            modelId: activeVehicleModels[0]?.vehicleModelId ?? '',
            stationId: activeStations[0]?.stationId ?? '',
            serialNumber: '',
            status: 'AVAILABLE',
            color: '',
            batteryLevel: '',
            batteryCapacity: '',
            range: '',
            img: '',
            lastMaintenance: '',
            isActive: true,
          });
          resetVehicleImageState();
          setIsVehicleModalOpen(false);
        } else {
          setImageUploadStatus('idle');
          setImageUploadError(null);
          setUploadedFileName(null);
        }
      } catch (err) {
        if (err instanceof Error && err.message.includes('phải là số hợp lệ')) {
          setVehicleFormError(err.message);
        } else {
          console.error('Failed to save vehicle:', err);
          setVehicleFormError(
            vehicleModalMode === 'edit'
              ? 'Không thể cập nhật xe. Vui lòng thử lại.'
              : 'Không thể tạo xe mới. Vui lòng thử lại.'
          );
        }
      } finally {
        setVehicleSubmitting(false);
      }
    };

  // Calculate stats
  const stats = useMemo(() => ({
    total: allVehicles.length,
    available: allVehicles.filter((v: FlatVehicle) => v.status === 'AVAILABLE').length,
    rented: allVehicles.filter((v: FlatVehicle) => v.status === 'RENTED').length,
    maintenance: allVehicles.filter((v: FlatVehicle) => v.status === 'MAINTENANCE').length,
    charging: allVehicles.filter((v: FlatVehicle) => v.status === 'CHARGING').length,
  }), [allVehicles]);

  const statusCounts = useMemo(
    () => ({
      AVAILABLE: stats.available,
      RENTED: stats.rented,
      MAINTENANCE: stats.maintenance,
      CHARGING: stats.charging,
    }),
    [stats]
  );

  const overviewCards = useMemo(
    () => [
      {
        key: 'total',
        label: 'Tổng số xe',
        value: formatNumber(stats.total),
        hint: 'Toàn bộ hệ thống',
        icon: <Car size={24} aria-hidden />,
      },
      {
        key: 'available',
        label: 'Xe sẵn sàng',
        value: formatNumber(stats.available),
        hint: 'Có thể bàn giao ngay',
        icon: <CheckCircle size={24} aria-hidden />,
      },
      {
        key: 'rented',
        label: 'Đang thuê',
        value: formatNumber(stats.rented),
        hint: 'Đang phục vụ khách',
        icon: <Car size={24} aria-hidden />,
      },
      {
        key: 'maintenance',
        label: 'Bảo trì & sạc',
        value: formatNumber(stats.maintenance + stats.charging),
        hint: `${formatNumber(stats.maintenance)} bảo trì • ${formatNumber(stats.charging)} sạc`,
        icon: <Wrench size={24} aria-hidden />,
      },
    ],
    [stats]
  );

  if (loading) {
    return (
      <div className="vehicle-management">
        <div className="loading-state">
          <Car size={48} />
          <h3>Đang tải dữ liệu...</h3>
          <p>Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicle-management">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-management">
      <div className="vehicle-management__header">
        <div className="vehicle-management__header-left">
          {onBack && (
            <button type="button" className="back-btn" onClick={onBack}>
              <ArrowLeft size={20} aria-hidden />
              Quay lại
            </button>
          )}
          <div className="vehicle-management__heading">
            <span className="vehicle-management__eyebrow">Quản trị đội xe</span>
            <h1>Quản lý xe</h1>
            <p>Quản lý tất cả xe từ hệ thống</p>
          </div>
        </div>
        <div className="vehicle-management__header-right">
          <div
            className="vehicle-management__actions"
            role="group"
            aria-label="Tạo dữ liệu xe"
          >
            <button
              type="button"
              className="vehicle-management__action-btn"
              onClick={openTypeModal}
            >
              <Plus size={16} aria-hidden />
              <span>Loại xe</span>
            </button>
            <button
              type="button"
              className="vehicle-management__action-btn"
              onClick={openModelModal}
              disabled={activeVehicleTypes.length === 0}
              title={activeVehicleTypes.length === 0 ? 'Cần ít nhất một loại xe đang hoạt động' : undefined}
            >
              <Plus size={16} aria-hidden />
              <span>Mẫu xe</span>
            </button>
            <button
              type="button"
                  className="vehicle-management__action-btn"
                  onClick={openCreateVehicleModal}
              disabled={activeVehicleModels.length === 0}
              title={activeVehicleModels.length === 0 ? 'Cần ít nhất một mẫu xe đang hoạt động' : undefined}
            >
              <Plus size={16} aria-hidden />
              <span>Xe</span>
            </button>
          </div>
          <div className="vehicle-management__view-toggle" role="tablist" aria-label="Chế độ hiển thị">
            {(
              [
                { value: 'table' as ViewMode, label: 'Thẻ', icon: <LayoutGrid size={16} aria-hidden /> },
                { value: 'hierarchy' as ViewMode, label: 'Phân cấp', icon: <GitBranch size={16} aria-hidden /> },
              ]
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={viewMode === option.value}
                className={`view-toggle__button ${viewMode === option.value ? 'view-toggle__button--active' : ''}`}
                onClick={() => setViewMode(option.value)}
              >
                {option.icon}
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="vehicle-management__overview">
        {overviewCards.map((card) => (
          <div key={card.key} className={`overview-card overview-card--${card.key}`}>
            <div className="overview-card__icon">{card.icon}</div>
            <div className="overview-card__content">
              <span className="overview-card__label">{card.label}</span>
              <span className="overview-card__value">{card.value}</span>
              <span className="overview-card__hint">{card.hint}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="vehicle-management__toolbar">
        <div className="toolbar-search">
          <Search size={18} aria-hidden />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm theo số serial, mẫu, hãng hoặc loại xe"
          />
        </div>

        <div className="toolbar-status">
          <span className="toolbar-status__label">
            <SlidersHorizontal size={16} aria-hidden />
            Trạng thái
          </span>
          <div className="filter-chips">
            {STATUS_FILTERS.map((filter) => {
              const count =
                filter.value === 'ALL'
                  ? stats.total
                  : statusCounts[filter.value as VehicleStatus] ?? 0;
              const isActive = statusFilter === filter.value;
              const isDisabled = !isActive && filter.value !== 'ALL' && count === 0;

              return (
                <button
                  key={filter.value}
                  type="button"
                  className={`filter-chip ${isActive ? 'filter-chip--active' : ''}`}
                  onClick={() => setStatusFilter(filter.value)}
                  disabled={isDisabled}
                >
                  {filter.label}
                  <span className="filter-chip__count">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="vehicle-management__content">
          <div className="vehicle-grid">
            {filteredVehicles.map((vehicle) => (
              <div key={vehicle.vehicle_id} className="vehicle-card">
                <div className="vehicle-card__header">
                  <div className="vehicle-card__image">
                    <CloudinaryImage
                      src={vehicle.img}
                      alt={[vehicle.manufacturer, vehicle.model_name].filter(Boolean).join(' ') || 'Xe'}
                      width={320}
                      height={240}
                      cropToSquare={false}
                      className="vehicle-card__image-content"
                      fallback={<Car size={40} aria-hidden />}
                    />
                  </div>
                  <div className="vehicle-card__status">
                    {getStatusIcon(vehicle.status)}
                    <span>{getStatusText(vehicle.status)}</span>
                  </div>
                </div>

                <div className="vehicle-card__content">
                  <h3 className="vehicle-card__title">
                    {vehicle.manufacturer} {vehicle.model_name}
                  </h3>
                  <p className="vehicle-card__serial">{vehicle.serial_number}</p>
                  <p className="vehicle-card__type">{vehicle.type_name}</p>

                  <div className="vehicle-card__details">
                    <div className="detail-item">
                      <Battery size={16} aria-hidden />
                      <span
                        className={`battery-level battery-level--${getBatteryColor(
                          vehicle.battery_level || 0
                        )}`}
                      >
                        {vehicle.battery_level}%
                      </span>
                    </div>
                    <div className="detail-item">
                      <MapPin size={16} aria-hidden />
                      <span>{vehicle.range}km</span>
                    </div>
                    <div className="detail-item">
                      <span
                        className="color-indicator"
                        style={{ backgroundColor: vehicle.color?.toLowerCase() }}
                      />
                      <span>{vehicle.color}</span>
                    </div>
                  </div>

                  {vehicle.last_maintenance && (
                    <div className="vehicle-card__maintenance">
                      <Wrench size={14} aria-hidden />
                      <span>
                        Bảo trì: {new Date(vehicle.last_maintenance).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  )}

                  <div className="vehicle-card__price">
                    <span className="price-label">Giá thuê</span>
                    <span className="price-value">
                      {vehicle.price_per_hour.toLocaleString('vi-VN')}đ/giờ
                    </span>
                  </div>
                </div>

                <div className="vehicle-card__actions">
                  <button
                    type="button"
                    className="action-btn action-btn--view"
                    onClick={() => openEditVehicleModal(vehicle.vehicle_id)}
                  >
                    <Eye size={16} aria-hidden />
                    Xem chi tiết
                  </button>
                  <button
                    type="button"
                    className="action-btn action-btn--edit"
                    onClick={() => openEditVehicleModal(vehicle.vehicle_id)}
                  >
                    <Edit size={16} aria-hidden />
                    Sửa
                  </button>
                  <button type="button" className="action-btn action-btn--delete">
                    <Trash2 size={16} aria-hidden />
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredVehicles.length === 0 && (
            <div className="empty-state">
              <Car size={48} aria-hidden />
              <h3>Không tìm thấy xe nào</h3>
              <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          )}
        </div>
      ) : (
        <div className="vehicle-management__hierarchy">
          <VehicleHierarchyView
            vehicles={filteredVehicles}
            viewMode="tree"
            onSelectVehicle={() => {}}
          />
        </div>
      )}

      {isTypeModalOpen && (
        <ManagementModal title="Tạo loại xe mới" onClose={closeTypeModal}>
          <form className="management-form" onSubmit={handleSubmitType}>
            <div className="management-form__group">
              <label htmlFor="create-type-name">Tên loại xe</label>
              <input
                id="create-type-name"
                type="text"
                value={typeForm.typeName}
                onChange={(event) =>
                  setTypeForm((prev) => ({ ...prev, typeName: event.target.value }))
                }
                placeholder="Ví dụ: Sedan, SUV..."
                autoFocus
                required
              />
            </div>
            <div className="management-form__group">
              <label htmlFor="create-type-description">Mô tả</label>
              <textarea
                id="create-type-description"
                value={typeForm.description}
                onChange={(event) =>
                  setTypeForm((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
                placeholder="Thông tin chi tiết về loại xe"
              />
            </div>
            {typeFormError && (
              <p className="management-form__error" role="alert">
                {typeFormError}
              </p>
            )}
            <div className="management-form__actions">
              <button
                type="submit"
                className="management-form__submit"
                disabled={typeSubmitting}
              >
                {typeSubmitting ? 'Đang tạo...' : 'Tạo loại xe'}
              </button>
              <button
                type="button"
                className="management-form__cancel"
                onClick={closeTypeModal}
                disabled={typeSubmitting}
              >
                Hủy
              </button>
            </div>
          </form>
        </ManagementModal>
      )}

      {isModelModalOpen && (
        <ManagementModal title="Tạo mẫu xe mới" onClose={closeModelModal}>
          <form className="management-form" onSubmit={handleSubmitModel}>
            <div className="management-form__group">
              <label htmlFor="create-model-type">Loại xe</label>
              <select
                id="create-model-type"
                value={modelForm.typeId}
                onChange={(event) =>
                  setModelForm((prev) => ({ ...prev, typeId: event.target.value }))
                }
                required
              >
                <option value="" disabled>
                  Chọn loại xe
                </option>
                {activeVehicleTypes.map((type) => (
                  <option key={type.vehicleTypeId} value={type.vehicleTypeId}>
                    {type.typeName}
                  </option>
                ))}
              </select>
            </div>
            <div className="management-form__group">
              <label htmlFor="create-model-name">Tên mẫu xe</label>
              <input
                id="create-model-name"
                type="text"
                value={modelForm.name}
                onChange={(event) =>
                  setModelForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ví dụ: Model 3"
                required
              />
            </div>
            <div className="management-form__group">
              <label htmlFor="create-model-manufacturer">Hãng sản xuất</label>
              <input
                id="create-model-manufacturer"
                type="text"
                value={modelForm.manufacturer}
                onChange={(event) =>
                  setModelForm((prev) => ({ ...prev, manufacturer: event.target.value }))
                }
                placeholder="Ví dụ: Tesla"
                required
              />
            </div>
            <div className="management-form__group">
              <label htmlFor="create-model-price">Giá thuê (đ/giờ)</label>
              <input
                id="create-model-price"
                type="number"
                min="0"
                step="0.01"
                value={modelForm.pricePerHour}
                onChange={(event) =>
                  setModelForm((prev) => ({ ...prev, pricePerHour: event.target.value }))
                }
                placeholder="Ví dụ: 25"
                required
              />
            </div>
            <div className="management-form__group">
              <label htmlFor="create-model-specs">Thông số kỹ thuật</label>
              <textarea
                id="create-model-specs"
                value={modelForm.specs}
                onChange={(event) =>
                  setModelForm((prev) => ({ ...prev, specs: event.target.value }))
                }
                rows={3}
                placeholder="Quãng đường, mức tiêu thụ, tính năng..."
              />
            </div>
            {modelFormError && (
              <p className="management-form__error" role="alert">
                {modelFormError}
              </p>
            )}
            <div className="management-form__actions">
              <button
                type="submit"
                className="management-form__submit"
                disabled={modelSubmitting || activeVehicleTypes.length === 0}
              >
                {modelSubmitting ? 'Đang tạo...' : 'Tạo mẫu xe'}
              </button>
              <button
                type="button"
                className="management-form__cancel"
                onClick={closeModelModal}
                disabled={modelSubmitting}
              >
                Hủy
              </button>
            </div>
          </form>
        </ManagementModal>
      )}

      {isVehicleModalOpen && (
        <ManagementModal
          title={vehicleModalMode === 'edit' ? 'Cập nhật thông tin xe' : 'Thêm xe mới'}
          onClose={closeVehicleModal}
        >
          <form className="management-form" onSubmit={handleSubmitVehicle}>
            <div className="management-form__group">
              <label htmlFor="create-vehicle-model">Mẫu xe</label>
              <select
                id="create-vehicle-model"
                value={vehicleForm.modelId}
                onChange={(event) =>
                  setVehicleForm((prev) => ({ ...prev, modelId: event.target.value }))
                }
                required
              >
                <option value="" disabled>
                  Chọn mẫu xe
                </option>
                {activeVehicleModels.map((model) => (
                  <option key={model.vehicleModelId} value={model.vehicleModelId}>
                    {model.manufacturer} {model.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="management-form__group">
              <label htmlFor="create-vehicle-serial">Số serial</label>
              <input
                id="create-vehicle-serial"
                type="text"
                value={vehicleForm.serialNumber}
                onChange={(event) =>
                  setVehicleForm((prev) => ({ ...prev, serialNumber: event.target.value }))
                }
                placeholder="Ví dụ: TSL-M3-001"
                required
                disabled={vehicleModalMode === 'edit'}
              />
            </div>
            <div className="management-form__group">
              <label htmlFor="create-vehicle-station">Trạm</label>
              <select
                id="create-vehicle-station"
                value={vehicleForm.stationId}
                onChange={(event) =>
                  setVehicleForm((prev) => ({ ...prev, stationId: event.target.value }))
                }
                disabled={activeStations.length === 0}
              >
                <option value="">Không gán trạm</option>
                {activeStations.map((station) => (
                  <option key={station.stationId} value={station.stationId}>
                    {station.name}
                  </option>
                ))}
              </select>
              {activeStations.length === 0 && (
                <span className="management-form__hint">
                  Không có trạm khả dụng. Bạn có thể tạo trạm trước rồi quay lại.
                </span>
              )}
            </div>
            <div className="management-form__group">
              <label htmlFor="create-vehicle-status">Trạng thái</label>
              <select
                id="create-vehicle-status"
                value={vehicleForm.status}
                onChange={(event) =>
                  setVehicleForm((prev) => ({
                    ...prev,
                    status: event.target.value as VehicleStatus,
                  }))
                }
                required
              >
                {VEHICLE_STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="management-form__group">
              <label htmlFor="create-vehicle-color">Màu sắc</label>
              <input
                id="create-vehicle-color"
                type="text"
                value={vehicleForm.color}
                onChange={(event) =>
                  setVehicleForm((prev) => ({ ...prev, color: event.target.value }))
                }
                placeholder="Ví dụ: Pearl White"
              />
            </div>
            <div className="management-form__group management-form__group--inline">
              <div>
                <label htmlFor="create-vehicle-battery-level">Mức pin (%)</label>
                <input
                  id="create-vehicle-battery-level"
                  type="number"
                  min="0"
                  max="100"
                  value={vehicleForm.batteryLevel}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({ ...prev, batteryLevel: event.target.value }))
                  }
                  placeholder="Ví dụ: 85"
                />
              </div>
              <div>
                <label htmlFor="create-vehicle-battery-capacity">Dung lượng pin (kWh)</label>
                <input
                  id="create-vehicle-battery-capacity"
                  type="number"
                  min="0"
                  step="0.1"
                  value={vehicleForm.batteryCapacity}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({
                      ...prev,
                      batteryCapacity: event.target.value,
                    }))
                  }
                  placeholder="Ví dụ: 75"
                />
              </div>
            </div>
            <div className="management-form__group management-form__group--inline">
              <div>
                <label htmlFor="create-vehicle-range">Quãng đường (km)</label>
                <input
                  id="create-vehicle-range"
                  type="number"
                  min="0"
                  value={vehicleForm.range}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({ ...prev, range: event.target.value }))
                  }
                  placeholder="Ví dụ: 400"
                />
              </div>
              <div>
                <label htmlFor="create-vehicle-image">Hình ảnh xe</label>
                <input
                  id="create-vehicle-image"
                  type="text"
                  value={vehicleForm.img}
                  onChange={(event) => handleVehicleImageValueChange(event.target.value)}
                  placeholder="Cloudinary ID hoặc URL sẵn có"
                  required
                />
                <div className="management-form__file">
                  <input
                    id="create-vehicle-image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="management-form__file-input"
                    ref={imageUploadInputRef}
                  />
                  <button
                    type="button"
                    className="management-form__file-button"
                    onClick={() => !isImageUploading && imageUploadInputRef.current?.click()}
                    disabled={isImageUploading}
                  >
                    Chọn ảnh từ máy
                  </button>
                  {uploadedFileName && (
                    <span className="management-form__file-name" title={uploadedFileName}>
                      {uploadedFileName}
                    </span>
                  )}
                </div>
                <span className="management-form__hint">
                  Ảnh sẽ được tải lên Cloudinary và lưu lại cùng thông tin xe.
                </span>
                {isImageUploading && (
                  <span className="management-form__hint">Đang tải ảnh lên...</span>
                )}
                {imageUploadStatus === 'success' && !imageUploadError && (
                  <span className="management-form__hint management-form__hint--success">
                    Ảnh đã sẵn sàng để lưu.
                  </span>
                )}
                {imageUploadStatus === 'error' && imageUploadError && (
                  <span className="management-form__hint management-form__hint--error">
                    {imageUploadError}
                  </span>
                )}
              </div>
            </div>
            <div className="management-form__group management-form__group--inline">
              <div>
                <label htmlFor="create-vehicle-last-maintenance">Ngày bảo trì gần nhất</label>
                <input
                  id="create-vehicle-last-maintenance"
                  type="date"
                  value={vehicleForm.lastMaintenance}
                  onChange={(event) =>
                    setVehicleForm((prev) => ({ ...prev, lastMaintenance: event.target.value }))
                  }
                />
              </div>
              <div className="management-form__checkbox">
                <label htmlFor="create-vehicle-is-active" className="checkbox-label">
                  <input
                    id="create-vehicle-is-active"
                    type="checkbox"
                    checked={vehicleForm.isActive}
                    onChange={(event) =>
                      setVehicleForm((prev) => ({ ...prev, isActive: event.target.checked }))
                    }
                  />
                  <span>Kích hoạt xe</span>
                </label>
              </div>
            </div>
            {imagePreviewSrc && (
              <div className="management-form__preview" aria-live="polite">
                <CloudinaryImage
                  src={imagePreviewSrc}
                  alt={vehiclePreviewAlt}
                  width={360}
                  height={260}
                  cropToSquare={false}
                  className="management-form__preview-image"
                />
              </div>
            )}
            {vehicleFormError && (
              <p className="management-form__error" role="alert">
                {vehicleFormError}
              </p>
            )}
            {vehicleDetailLoading && (
              <p className="management-form__hint" role="status">
                Đang tải thông tin xe...
              </p>
            )}
            {vehicleFormSuccess && (
              <p className="management-form__success" role="status">
                {vehicleFormSuccess}
              </p>
            )}
            <div className="management-form__actions">
              <button
                type="submit"
                className="management-form__submit"
                disabled={
                  vehicleSubmitting ||
                  activeVehicleModels.length === 0 ||
                  isImageUploading ||
                  vehicleDetailLoading
                }
              >
                {vehicleSubmitting
                  ? 'Đang lưu...'
                  : vehicleModalMode === 'edit'
                    ? 'Cập nhật xe'
                    : 'Thêm xe'}
              </button>
              <button
                type="button"
                className="management-form__cancel"
                onClick={closeVehicleModal}
                disabled={vehicleSubmitting}
              >
                Hủy
              </button>
            </div>
          </form>
        </ManagementModal>
      )}
    </div>
  );
};

export default VehicleManagement;
