import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Car,
  Package,
  DollarSign,
  AlertCircle,
  Loader,
  ArrowLeft,
  Zap,
  X,
  Battery,
  MapPin,
  CheckCircle,
  Wrench,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  vehicleService,
  VehicleType,
  VehicleModel,
  HierarchyVehicleType,
  HierarchyVehicle,
} from '../../services';
import './VehicleModelSelection.scss';

type VehicleStatus = 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'CHARGING';
type StatusFilter = 'ALL' | VehicleStatus;

interface VehicleModelSelectionProps {
  onBack?: () => void;
}

interface SelectedModelInfo {
  modelId: string;
  modelName: string;
  manufacturer: string;
  typeName: string;
}

interface ModelStats {
  total: number;
  byStatus: Record<VehicleStatus, number>;
}

const STATUS_LABELS: Record<VehicleStatus, string> = {
  AVAILABLE: 'Có sẵn',
  RENTED: 'Đang được thuê',
  MAINTENANCE: 'Bảo trì',
  CHARGING: 'Đang sạc',
};

const MODEL_STATUS_FILTERS: { label: string; value: StatusFilter }[] = [
  { label: 'Tất cả', value: 'ALL' },
  { label: STATUS_LABELS.AVAILABLE, value: 'AVAILABLE' },
  { label: STATUS_LABELS.RENTED, value: 'RENTED' },
  { label: STATUS_LABELS.MAINTENANCE, value: 'MAINTENANCE' },
  { label: STATUS_LABELS.CHARGING, value: 'CHARGING' },
];

const VEHICLE_STATUS_FILTERS = MODEL_STATUS_FILTERS;

const createEmptyStats = (): ModelStats => ({
  total: 0,
  byStatus: {
    AVAILABLE: 0,
    RENTED: 0,
    MAINTENANCE: 0,
    CHARGING: 0,
  },
});

const formatNumber = (value: number) => value.toLocaleString('vi-VN');

const VehicleModelSelection: React.FC<VehicleModelSelectionProps> = ({ onBack }) => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [hierarchyData, setHierarchyData] = useState<HierarchyVehicleType[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<SelectedModelInfo | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<StatusFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [types, models, hierarchy] = await Promise.all([
        vehicleService.getVehicleTypes(),
        vehicleService.getVehicleModels(),
        vehicleService.buildHierarchyData(),
      ]);
      setVehicleTypes(types.filter((type) => type.isactive));
      setVehicleModels(models.filter((model) => model.isactive));
      setHierarchyData(hierarchy);
      
      // Auto-select first type
      if (types.length > 0) {
        const firstActiveType = types.find((t) => t.isactive);
        if (firstActiveType) {
          setSelectedTypeId(firstActiveType.vehicleTypeId);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = vehicleTypes.find((t) => t.vehicleTypeId === selectedTypeId) ?? null;

  const selectedTypeModels = useMemo(() => {
    if (!selectedTypeId) {
      return [];
    }
    return vehicleModels.filter((model) => model.typeId === selectedTypeId);
  }, [vehicleModels, selectedTypeId]);

  const totalTypes = useMemo(() => vehicleTypes.length, [vehicleTypes]);
  const totalModels = useMemo(() => vehicleModels.length, [vehicleModels]);

  const totalVehicles = useMemo(
    () =>
      hierarchyData.reduce((acc, type) => {
        const modelCount = type.models.reduce(
          (modelAcc, model) => modelAcc + (model.vehicles ? model.vehicles.length : 0),
          0
        );
        return acc + modelCount;
      }, 0),
    [hierarchyData]
  );

  const totalAvailableVehicles = useMemo(
    () =>
      hierarchyData.reduce((acc, type) => {
        const availableCount = type.models.reduce((modelAcc, model) => {
          if (!model.vehicles) {
            return modelAcc;
          }
          return (
            modelAcc +
            model.vehicles.filter((vehicle) => vehicle.status === 'AVAILABLE').length
          );
        }, 0);
        return acc + availableCount;
      }, 0),
    [hierarchyData]
  );

  const getVehiclesForModel = useCallback(
    (modelName: string, typeName?: string): HierarchyVehicle[] => {
      const matches: HierarchyVehicle[] = [];

      hierarchyData.forEach((type) => {
        if (typeName && type.name !== typeName) {
          return;
        }

        type.models.forEach((model) => {
          if (model.name === modelName) {
            matches.push(...(model.vehicles || []));
          }
        });
      });

      return matches;
    },
    [hierarchyData]
  );

  const modelStatsMap = useMemo(() => {
    const statsMap = new Map<string, ModelStats>();

    hierarchyData.forEach((type) => {
      type.models.forEach((model) => {
        const stats = createEmptyStats();
        const vehicles = model.vehicles || [];

        stats.total = vehicles.length;
        vehicles.forEach((vehicle) => {
          const status = vehicle.status as VehicleStatus;
          if (stats.byStatus[status] !== undefined) {
            stats.byStatus[status] += 1;
          }
        });

        statsMap.set(`${type.name}::${model.name}`, stats);
      });
    });

    return statsMap;
  }, [hierarchyData]);

  const selectedTypeAggregate = useMemo(() => {
    if (!selectedType) {
      return {
        models: totalModels,
        vehicles: totalVehicles,
        available: totalAvailableVehicles,
      };
    }

    const typeName = selectedType.typeName;
    let vehicles = 0;
    let available = 0;

    selectedTypeModels.forEach((model) => {
      const stats = modelStatsMap.get(`${typeName}::${model.name}`);
      if (stats) {
        vehicles += stats.total;
        available += stats.byStatus.AVAILABLE;
      }
    });

    return {
      models: selectedTypeModels.length,
      vehicles,
      available,
    };
  }, [selectedType, selectedTypeModels, modelStatsMap, totalAvailableVehicles, totalModels, totalVehicles]);

  const overviewMetrics = useMemo(() => {
    const metrics = [
      {
        label: 'Loại xe',
        value: formatNumber(totalTypes),
        hint: 'Đang hoạt động',
      },
      {
        label: selectedType ? `Mẫu thuộc ${selectedType.typeName}` : 'Tổng mẫu xe',
        value: formatNumber(selectedTypeAggregate.models),
        hint: selectedType ? 'Đang hiển thị' : 'Toàn bộ hệ thống',
      },
      {
        label: 'Tổng số xe',
        value: formatNumber(totalVehicles),
        hint: 'Trong toàn hệ thống',
      },
      {
        label: selectedType ? 'Xe thuộc loại này' : 'Xe có sẵn',
        value: formatNumber(
          selectedType ? selectedTypeAggregate.vehicles : totalAvailableVehicles
        ),
        hint: selectedType
          ? `${formatNumber(selectedTypeAggregate.available)} xe sẵn sàng`
          : 'Đang ở trạng thái "Có sẵn"',
      },
    ];

    return metrics;
  }, [selectedType, selectedTypeAggregate, totalAvailableVehicles, totalTypes, totalVehicles]);

  const filteredModels = useMemo(() => {
    if (!selectedType) {
      return [];
    }

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const typeName = selectedType.typeName;

    return selectedTypeModels.filter((model) => {
      const matchesSearch = normalizedSearch
        ? `${model.manufacturer} ${model.name}`.toLowerCase().includes(normalizedSearch)
        : true;

      const stats = modelStatsMap.get(`${typeName}::${model.name}`) ?? createEmptyStats();
      const matchesStatus =
        statusFilter === 'ALL' || (stats.byStatus[statusFilter] ?? 0) > 0;

      return matchesSearch && matchesStatus;
    });
  }, [modelStatsMap, searchTerm, selectedType, selectedTypeModels, statusFilter]);

  const vehiclesForSelectedModel = useMemo(() => {
    if (!selectedModel) {
      return [];
    }

    return getVehiclesForModel(selectedModel.modelName, selectedModel.typeName);
  }, [getVehiclesForModel, selectedModel]);

  const selectedModelStats = useMemo(() => {
    if (!selectedModel) {
      return createEmptyStats();
    }

    return (
      modelStatsMap.get(`${selectedModel.typeName}::${selectedModel.modelName}`) ||
      createEmptyStats()
    );
  }, [modelStatsMap, selectedModel]);

  const displayedVehicles = useMemo(() => {
    if (vehicleStatusFilter === 'ALL') {
      return vehiclesForSelectedModel;
    }

    return vehiclesForSelectedModel.filter(
      (vehicle) => vehicle.status === vehicleStatusFilter
    );
  }, [vehicleStatusFilter, vehiclesForSelectedModel]);

  useEffect(() => {
    if (!selectedModel) {
      return;
    }

    const stillExists = filteredModels.some(
      (model) => model.vehicleModelId === selectedModel.modelId
    );

    if (!stillExists) {
      setSelectedModel(null);
    }
  }, [filteredModels, selectedModel]);

  const getStatusIcon = (status: string) => {
    const statusKey = status as VehicleStatus;
    switch (statusKey) {
      case 'AVAILABLE':
        return <CheckCircle size={14} className="status-icon status-icon--available" aria-hidden />;
      case 'RENTED':
        return <Car size={14} className="status-icon status-icon--rented" aria-hidden />;
      case 'MAINTENANCE':
        return <Wrench size={14} className="status-icon status-icon--maintenance" aria-hidden />;
      case 'CHARGING':
        return <Zap size={14} className="status-icon status-icon--charging" aria-hidden />;
      default:
        return <AlertCircle size={14} aria-hidden />;
    }
  };

  const getStatusText = (status: string) => {
    const statusKey = status as VehicleStatus;
    return STATUS_LABELS[statusKey] ?? status;
  };

  const getBatteryColor = (level: number | null) => {
    if (level === null || level === undefined) {
      return 'unknown';
    }

    if (level >= 70) {
      return 'success';
    }

    if (level >= 30) {
      return 'warning';
    }

    return 'error';
  };

  const handleViewVehicles = (model: VehicleModel) => {
    if (!selectedType) {
      return;
    }

    setSelectedModel({
      modelId: model.vehicleModelId,
      modelName: model.name,
      manufacturer: model.manufacturer,
      typeName: selectedType.typeName,
    });
    setVehicleStatusFilter('ALL');
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
  };

  const handleVehicleStatusFilterChange = (value: StatusFilter) => {
    setVehicleStatusFilter(value);
  };

  if (loading) {
    return (
      <div className="vehicle-model-selection">
        <div className="loading-state">
          <Loader size={40} className="spinner" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vehicle-model-selection">
        <div className="error-state">
          <AlertCircle size={48} />
          <h3>Lỗi tải dữ liệu</h3>
          <p>{error}</p>
          <button onClick={() => fetchData()} className="retry-btn">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-model-selection">
      {/* Header */}
      <div className="vms-header">
        {onBack && (
          <button className="back-btn" type="button" onClick={onBack}>
            <ArrowLeft size={20} />
            Quay lại
          </button>
        )}
        <div className="vms-header__title">
          <h1>Chọn loại xe</h1>
          <p>Chọn loại xe để xem các mẫu có sẵn</p>
        </div>
      </div>

      <div className="vms-overview">
        {overviewMetrics.map((metric) => (
          <div key={metric.label} className="overview-card">
            <span className="overview-card__label">{metric.label}</span>
            <span className="overview-card__value">{metric.value}</span>
            <span className="overview-card__hint">{metric.hint}</span>
          </div>
        ))}
      </div>

      <div className="vms-container">
        {/* Left Panel: Vehicle Types */}
        <div className="vms-types-panel">
          <h2>Loại xe</h2>
          <div className="types-list">
            {vehicleTypes.map((type) => (
              <button
                key={type.vehicleTypeId}
                className={`type-card ${selectedTypeId === type.vehicleTypeId ? 'active' : ''}`}
                type="button"
                onClick={() => {
                  setSelectedTypeId(type.vehicleTypeId);
                  setSelectedModel(null); // Clear selected model when changing type
                }}
              >
                <div className="type-card__icon">
                  <Car size={32} />
                </div>
                <div className="type-card__content">
                  <h3>{type.typeName}</h3>
                  <p>{type.description}</p>
                </div>
                {selectedTypeId === type.vehicleTypeId && (
                  <div className="type-card__indicator"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Models and Vehicles */}
        <div className="vms-models-panel">
          {selectedType ? (
            <>
              <div className="models-header">
                <div className="models-header__info">
                  <h2>Các mẫu xe: {selectedType.typeName}</h2>
                  <p>{selectedType.description}</p>
                </div>
                <span className="models-count">{selectedTypeModels.length} mẫu</span>
              </div>

              <div className="models-toolbar">
                <div className="models-toolbar__search">
                  <Search size={16} aria-hidden />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm kiếm theo mẫu hoặc hãng"
                  />
                </div>

                <div className="models-toolbar__filters">
                  <span className="models-toolbar__filters-label">
                    <SlidersHorizontal size={16} aria-hidden />
                    Trạng thái
                  </span>
                  <div className="filter-chips">
                    {MODEL_STATUS_FILTERS.map((filter) => (
                      <button
                        key={filter.value}
                        type="button"
                        className={`filter-chip ${statusFilter === filter.value ? 'filter-chip--active' : ''}`}
                        onClick={() => handleStatusFilterChange(filter.value)}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {selectedTypeModels.length > 0 ? (
                <>
                  <div className="models-grid">
                    {filteredModels.length > 0 ? (
                      filteredModels.map((model) => {
                        const stats = selectedType
                          ? modelStatsMap.get(`${selectedType.typeName}::${model.name}`) ?? createEmptyStats()
                          : createEmptyStats();

                        return (
                          <div
                            key={model.vehicleModelId}
                            className={`model-card ${
                              selectedModel?.modelId === model.vehicleModelId ? 'active' : ''
                            }`}
                          >
                            <div className="model-card__header">
                              <div className="model-card__icon">
                                <Package size={28} aria-hidden />
                              </div>
                              <span className="model-card__badge">Mẫu</span>
                            </div>

                            <div className="model-card__content">
                              <h3 className="model-card__name">
                                {model.manufacturer} {model.name}
                              </h3>

                              <div className="model-card__price">
                                <DollarSign size={14} aria-hidden />
                                <span>{model.pricePerHour.toLocaleString('vi-VN')}đ/giờ</span>
                              </div>

                              <div className="model-card__stats">
                                <span className="stat-pill stat-pill--primary">
                                  Có sẵn {stats.byStatus.AVAILABLE}
                                </span>
                                <span className="stat-pill">
                                  Tổng {stats.total}
                                </span>
                              </div>
                            </div>

                            <div className="model-card__footer">
                              <button
                                type="button"
                                className="model-card__btn model-card__btn--view"
                                onClick={() => handleViewVehicles(model)}
                              >
                                <Zap size={14} aria-hidden />
                                Xem xe
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="models-empty">
                        <Car size={48} aria-hidden />
                        <h3>Không tìm thấy mẫu phù hợp</h3>
                        <p>Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                      </div>
                    )}
                  </div>

                  {/* Vehicle List Panel */}
                  {selectedModel && (
                    <div className="vehicles-panel">
                      <div className="vehicles-panel__header">
                        <div className="vehicles-panel__title">
                          <span className="vehicles-panel__eyebrow">Danh sách xe</span>
                          <h3>
                            {selectedModel.manufacturer} {selectedModel.modelName}
                          </h3>
                          <div className="vehicles-panel__meta">
                            <span>Tổng: {formatNumber(selectedModelStats.total)}</span>
                            <span>
                              Có sẵn: {formatNumber(selectedModelStats.byStatus.AVAILABLE)}
                            </span>
                          </div>
                        </div>
                        <button 
                          type="button"
                          className="vehicles-panel__close"
                          onClick={() => setSelectedModel(null)}
                        >
                          <X size={20} />
                        </button>
                      </div>

                      <div className="vehicles-panel__filters">
                        <span className="vehicles-panel__filters-label">
                          Trạng thái xe
                        </span>
                        <div className="filter-chips">
                          {VEHICLE_STATUS_FILTERS.map((filter) => {
                            const count =
                              filter.value === 'ALL'
                                ? selectedModelStats.total
                                : selectedModelStats.byStatus[filter.value as VehicleStatus] ?? 0;

                            const isActive = vehicleStatusFilter === filter.value;
                            const isDisabled = !isActive && count === 0;

                            return (
                              <button
                                key={filter.value}
                                type="button"
                                className={`filter-chip ${isActive ? 'filter-chip--active' : ''}`}
                                onClick={() => handleVehicleStatusFilterChange(filter.value)}
                                disabled={isDisabled}
                              >
                                {filter.label}
                                <span className="filter-chip__count">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {displayedVehicles.length > 0 ? (
                        <div className="vehicles-list">
                          {displayedVehicles.map((vehicle) => (
                            <div key={vehicle.id} className="vehicle-item">
                              <div className="vehicle-item__image">
                                {vehicle.img ? (
                                  <img src={vehicle.img} alt={selectedModel.modelName} />
                                ) : (
                                  <Car size={36} aria-hidden />
                                )}
                              </div>

                              <div className="vehicle-item__info">
                                <div className="vehicle-item__serial">
                                  <strong>{vehicle.serialNumber}</strong>
                                </div>
                                <div className="vehicle-item__details">
                                  <span className="detail">
                                    <MapPin size={12} />
                                    {vehicle.color}
                                  </span>
                                  {vehicle.batteryLevel !== null && (
                                    <span className={`detail battery battery-${getBatteryColor(vehicle.batteryLevel)}`}>
                                      <Battery size={12} />
                                      {vehicle.batteryLevel}%
                                    </span>
                                  )}
                                  {vehicle.range !== null && (
                                    <span className="detail">
                                      <Zap size={12} />
                                      {vehicle.range}km
                                    </span>
                                  )}
                                </div>
                                <div className="vehicle-item__maintenance">
                                  {vehicle.lastMaintenance && (
                                    <>
                                      <Wrench size={12} />
                                      <span>{new Date(vehicle.lastMaintenance).toLocaleDateString('vi-VN')}</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              <div className="vehicle-item__status">
                                {getStatusIcon(vehicle.status)}
                                <span className={`status-text status-text--${vehicle.status.toLowerCase()}`}>
                                  {getStatusText(vehicle.status)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="vehicles-empty">
                          <Car size={40} aria-hidden />
                          <p>Không có xe nào phù hợp với bộ lọc hiện tại</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <Car size={48} aria-hidden />
                  <h3>Không có mẫu xe nào</h3>
                  <p>Loại xe này chưa có mẫu nào được thêm</p>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <Car size={48} aria-hidden />
              <h3>Chọn một loại xe</h3>
              <p>Bấm vào loại xe ở bên trái để xem các mẫu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleModelSelection;
