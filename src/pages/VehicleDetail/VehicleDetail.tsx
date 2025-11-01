import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft,
  Shield,
  Star,
  Car,
  Gauge,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  X
} from 'lucide-react';
import { NewVehicleCardData } from '../../types';
import {
  mockVehicleModels,
  mockVehicleTypes
} from '../../utils/vehicleMockData';
import NewVehicleCard from '../../components/NewVehicleCard/NewVehicleCard';
import BookingModal, { BookingSummary } from '../../components/BookingModal/BookingModal';
import { vehicleService, VehicleModel, VehicleType } from '../../services/vehicleService';
import './VehicleDetail.scss';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(Math.max(0, value));

const formatDateTimeDisplay = (value?: string) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN', {
    hour12: false,
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

interface VehicleDetailViewData extends NewVehicleCardData {
  manufacturer?: string;
  modelName?: string;
  typeDescription?: string;
  specs?: string;
}

interface VehicleDetailProps {
  vehicleCard: VehicleDetailViewData;
  onBack: () => void;
  onRentVehicle: (vehicle: NewVehicleCardData) => void;
  userRole: 'customer' | 'staff' | 'admin';
}

const VehicleDetail: React.FC<VehicleDetailProps> = ({
  vehicleCard,
  onBack,
  onRentVehicle,
  userRole
}) => {
  const [detail, setDetail] = useState<VehicleDetailViewData>(vehicleCard);
  const [modelInfo, setModelInfo] = useState<VehicleModel | null>(null);
  const [typeInfo, setTypeInfo] = useState<VehicleType | null>(null);
  const [relatedModels, setRelatedModels] = useState<NewVehicleCardData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<BookingSummary | null>(null);

  const buildDetailFromSources = useCallback((
    model?: VehicleModel | null,
    type?: VehicleType | null
  ): VehicleDetailViewData => {
    const allowed: NewVehicleCardData['status'][] = ['AVAILABLE', 'RENTED', 'MAINTENANCE', 'CHARGING'];
    const candidateStatus = vehicleCard.status?.toUpperCase() as NewVehicleCardData['status'] | undefined;
    const normalizedStatus = candidateStatus && allowed.includes(candidateStatus) ? candidateStatus : 'AVAILABLE';

    return {
      vehicle_id: vehicleCard.modelId ?? model?.vehicleModelId ?? vehicleCard.vehicle_id,
      modelId: vehicleCard.modelId ?? model?.vehicleModelId,
      name:
        vehicleCard.name ||
        `${model?.manufacturer ?? ''} ${model?.name ?? ''}`.trim() ||
        'Mẫu xe điện',
      modelName: vehicleCard.modelName ?? model?.name ?? vehicleCard.name,
      manufacturer: vehicleCard.manufacturer ?? model?.manufacturer,
      price_per_hour: model?.pricePerHour ?? vehicleCard.price_per_hour,
      battery_capacity: vehicleCard.battery_capacity ?? 0,
      range: vehicleCard.range ?? 0,
      type_name: type?.typeName ?? vehicleCard.type_name ?? 'Đang cập nhật',
      typeId: vehicleCard.typeId ?? type?.vehicleTypeId,
      typeDescription: vehicleCard.typeDescription ?? type?.description,
      status: normalizedStatus,
      img: vehicleCard.img,
      battery_level: vehicleCard.battery_level,
      color: vehicleCard.color,
      entityType: 'model',
      specs: model?.specs ?? vehicleCard.specs,
    };
  }, [vehicleCard]);

  const convertApiModelToCard = (
    model: VehicleModel,
    type?: VehicleType
  ): NewVehicleCardData => ({
    vehicle_id: model.vehicleModelId,
    modelId: model.vehicleModelId,
    name: `${model.manufacturer} ${model.name}`.trim(),
    modelName: model.name,
    manufacturer: model.manufacturer,
    price_per_hour: model.pricePerHour ?? 0,
    battery_capacity: 0,
    range: 0,
    type_name: type?.typeName ?? 'Đang cập nhật',
    typeId: type?.vehicleTypeId,
    typeDescription: type?.description,
    status: 'AVAILABLE',
    img: undefined,
    battery_level: undefined,
    color: undefined,
    entityType: 'model',
    specs: model.specs,
  });

  const convertMockModelToCard = (
    model: (typeof mockVehicleModels)[number],
    type?: (typeof mockVehicleTypes)[number]
  ): NewVehicleCardData => ({
    vehicle_id: model.vehicle_model_id,
    modelId: model.vehicle_model_id,
    name: `${model.manufacturer} ${model.name}`.trim(),
    modelName: model.name,
    manufacturer: model.manufacturer,
    price_per_hour: model.price_per_hour ?? 0,
    battery_capacity: 0,
    range: 0,
    type_name: type?.type_name ?? 'Đang cập nhật',
    typeId: type?.vehicle_type_id,
    typeDescription: type?.description,
    status: 'AVAILABLE',
    img: undefined,
    battery_level: undefined,
    color: undefined,
    entityType: 'model',
    specs: model.specs,
  });

  useEffect(() => {
    let mounted = true;

    const loadDetail = async () => {
      setIsLoading(true);
      setFetchError(null);
      setDetail(buildDetailFromSources());

      try {
        const [models, types] = await Promise.all([
          vehicleService.getVehicleModels(),
          vehicleService.getVehicleTypes(),
        ]);

        if (!mounted) {
          return;
        }

        const modelId = vehicleCard.modelId ?? vehicleCard.vehicle_id;
        const matchedModel =
          models.find((item) => item.vehicleModelId === modelId) ??
          models.find(
            (item) =>
              item.name.toLowerCase() === (vehicleCard.modelName ?? '').toLowerCase() &&
              item.manufacturer.toLowerCase() === (vehicleCard.manufacturer ?? '').toLowerCase()
          );

        const matchedType = matchedModel
          ? types.find((type) => type.vehicleTypeId === matchedModel.typeId)
          : types.find((type) => type.typeName.toLowerCase() === (vehicleCard.type_name ?? '').toLowerCase());

        const enrichedDetail = buildDetailFromSources(matchedModel, matchedType);

        const typeMap = new Map(types.map((type) => [type.vehicleTypeId, type]));

        const related = matchedModel
          ? models
              .filter(
                (model) =>
                  model.vehicleModelId !== matchedModel.vehicleModelId &&
                  model.typeId === matchedModel.typeId &&
                  model.isactive
              )
              .slice(0, 3)
              .map((model) => convertApiModelToCard(model, typeMap.get(model.typeId)))
          : [];

        setDetail(enrichedDetail);
        setModelInfo(matchedModel ?? null);
        setTypeInfo(matchedType ?? null);
        setRelatedModels(related);
      } catch (error) {
        console.error('Failed to load vehicle model detail:', error);
        if (!mounted) {
          return;
        }

        const typeMap = new Map(
          mockVehicleTypes
            .filter((type) => type.isActive)
            .map((type) => [type.vehicle_type_id, type])
        );

        const fallbackModel = mockVehicleModels.find(
          (model) => model.vehicle_model_id === (vehicleCard.modelId ?? vehicleCard.vehicle_id)
        );

        if (fallbackModel) {
          const fallbackType = typeMap.get(fallbackModel.type_id);

          const fallbackModelData: VehicleModel = {
            vehicleModelId: fallbackModel.vehicle_model_id,
            typeId: fallbackModel.type_id,
            name: fallbackModel.name,
            manufacturer: fallbackModel.manufacturer,
            pricePerHour: fallbackModel.price_per_hour,
            specs: fallbackModel.specs ?? '',
            createdAt: fallbackModel.created_at.toISOString(),
            isactive: fallbackModel.isActive,
            updatedAt: null,
          };

          const fallbackTypeData: VehicleType | undefined = fallbackType
            ? {
                vehicleTypeId: fallbackType.vehicle_type_id,
                typeName: fallbackType.type_name,
                description: fallbackType.description ?? '',
                createdAt: fallbackType.created_at.toISOString(),
                isactive: fallbackType.isActive,
                updatedAt: null,
              }
            : undefined;

          setDetail(buildDetailFromSources(fallbackModelData, fallbackTypeData ?? null));
          setModelInfo(fallbackModelData);
          setTypeInfo(fallbackTypeData ?? null);

          const related = mockVehicleModels
            .filter(
              (model) =>
                model.vehicle_model_id !== fallbackModel.vehicle_model_id &&
                model.type_id === fallbackModel.type_id &&
                model.isActive
            )
            .slice(0, 3)
            .map((model) => convertMockModelToCard(model, typeMap.get(model.type_id)));

          setRelatedModels(related);
          setFetchError('Không thể kết nối API, đang hiển thị dữ liệu mô phỏng.');
        } else {
          setFetchError('Không tìm thấy thông tin mẫu xe.');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadDetail();

    return () => {
      mounted = false;
    };
  }, [vehicleCard, buildDetailFromSources]);

  const getStatusText = () => {
    switch (detail.status) {
      case 'AVAILABLE':
        return 'Sẵn sàng';
      case 'CHARGING':
        return 'Đang sạc';
      case 'RENTED':
        return 'Đang thuê';
      case 'MAINTENANCE':
        return 'Bảo trì';
      default:
        return 'Không rõ';
    }
  };

  const formatRange = (value?: number | null) => {
    if (!value || value <= 0) return 'Đang cập nhật';
    return `${value} km`;
  };

  const formatBatteryCapacity = (value?: number | null) => {
    if (!value || value <= 0) return 'Đang cập nhật';
    return `${value} kWh`;
  };

  const formatSpecText = (value?: string) => {
    if (!value || !value.trim()) {
      return 'Thông tin đang cập nhật';
    }
    return value.trim();
  };

  const specDetailSource = detail.specs || modelInfo?.specs || '';
  const specHighlights = specDetailSource
    ? specDetailSource
        .split(/\r?\n|•|;|,/)
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  const quickStats = [
    {
      icon: Layers,
      label: 'Phân khúc',
      value: detail.type_name,
    },
    {
      icon: Car,
      label: 'Hãng sản xuất',
      value: detail.manufacturer ?? 'Đang cập nhật',
    },
    {
      icon: Star,
      label: 'Giá thuê / giờ',
      value: formatCurrency(detail.price_per_hour),
    },
  ];

  if (detail.range && detail.range > 0) {
    quickStats.push({
      icon: Gauge,
      label: 'Tầm hoạt động ước tính',
      value: formatRange(detail.range),
    });
  }

  if (detail.battery_capacity && detail.battery_capacity > 0) {
    quickStats.push({
      icon: Shield,
      label: 'Dung lượng pin tham chiếu',
      value: formatBatteryCapacity(detail.battery_capacity),
    });
  }

  const specifications = [
    { label: 'Mẫu xe', value: detail.modelName ?? detail.name },
    { label: 'Loại phương tiện', value: detail.type_name },
    { label: 'Mô tả loại xe', value: typeInfo?.description || detail.typeDescription || 'Đang cập nhật' },
    { label: 'Thông số kỹ thuật', value: formatSpecText(specDetailSource) },
    { label: 'Giá thuê / giờ', value: formatCurrency(detail.price_per_hour) },
  ];

  if (detail.range && detail.range > 0) {
    specifications.push({ label: 'Tầm hoạt động', value: formatRange(detail.range) });
  }

  if (detail.battery_capacity && detail.battery_capacity > 0) {
    specifications.push({ label: 'Dung lượng pin', value: formatBatteryCapacity(detail.battery_capacity) });
  }

  const highlightFeatures = [
    {
      title: 'Định vị phân khúc',
      description: typeInfo?.description || detail.typeDescription || 'Mẫu xe điện linh hoạt cho nhu cầu đi lại hàng ngày.',
    },
    {
      title: 'Thông số nổi bật',
      description: specHighlights.slice(0, 2).join(' • ') || 'Thông số chi tiết đang được cập nhật từ hệ thống.',
    },
    {
      title: 'Chi phí sở hữu',
      description: `Giá thuê đề xuất ${formatCurrency(detail.price_per_hour)} mỗi giờ.`,
    },
  ];

  const insightMetrics = [
    {
      title: 'Phân khúc',
      value: detail.type_name,
      description: 'Dựa trên thông tin Vehicle Type mới nhất.',
      icon: Layers,
      tone: 'info',
    },
    {
      title: 'Mục đích sử dụng',
      value: typeInfo?.description || detail.typeDescription || 'Đang cập nhật',
      description: 'Thông tin mô tả giúp lựa chọn đúng nhu cầu.',
      icon: Info,
      tone: typeInfo?.description ? 'positive' : 'neutral',
    },
    {
      title: 'Giá thuê tham khảo',
      value: formatCurrency(detail.price_per_hour),
      description: 'Áp dụng cho khách hàng lẻ, chưa gồm ưu đãi.',
      icon: Sparkles,
      tone: 'positive',
    },
  ];

  const rentalConditions = [
    {
      icon: Shield,
      title: 'Bảo hiểm toàn diện',
      description: 'Đã bao gồm bảo hiểm thân vỏ và trách nhiệm dân sự cho toàn thời gian thuê.'
    },
    {
      icon: Star,
      title: 'Ưu tiên trải nghiệm',
      description: 'Xe được vệ sinh và kiểm tra trước mỗi lượt giao khách hàng.'
    },
    {
      icon: Gauge,
      title: 'Hỗ trợ sử dụng',
      description: 'Cung cấp hướng dẫn chi tiết về cách vận hành và sạc pin.'
    }
  ];

  const canRent = detail.status === 'AVAILABLE';

  const handleBookingConfirm = (bookingData: BookingSummary) => {
    console.log('Booking confirmed:', bookingData);
    setBookingSuccess(bookingData);
    setIsBookingModalOpen(false);
  };

  const handleCloseSuccessModal = () => {
    setBookingSuccess(null);
  };

  if (isLoading) {
    return (
      <div className="vehicle-detail">
        <div className="container">
          <div className="vehicle-detail__not-found">
            <h2>Đang tải thông tin mẫu xe...</h2>
            <p>Vui lòng chờ trong giây lát.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="vehicle-detail">
        <div className="container">
          <div className="vehicle-detail__not-found">
            <h2>Không tìm thấy mẫu xe</h2>
            {fetchError && <p>{fetchError}</p>}
            <button onClick={onBack} className="btn btn--primary">
              <ArrowLeft size={16} />
              Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusText = getStatusText();
  const statusClass = detail.status ? detail.status.toLowerCase() : 'unknown';

  return (
    <div className="vehicle-detail">
      {bookingSuccess && (
        <div className="vehicle-detail__success-overlay" role="dialog" aria-modal="true">
          <div className="vehicle-detail__success-modal">
            <button
              type="button"
              className="vehicle-detail__success-close"
              onClick={handleCloseSuccessModal}
              aria-label="Đóng thông báo"
            >
              <X size={18} />
            </button>

            <div className="vehicle-detail__success-icon">
              <CheckCircle size={40} />
            </div>
            <h3 className="vehicle-detail__success-title">Đặt xe thành công</h3>
            <p className="vehicle-detail__success-message">
              {bookingSuccess.orderResult?.message || 'Đơn đặt xe của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ để xác nhận chi tiết.'}
            </p>

            <div className="vehicle-detail__success-summary">
              <div className="vehicle-detail__success-row">
                <span className="vehicle-detail__success-label">Mã đơn</span>
                <span className="vehicle-detail__success-value">{bookingSuccess.orderResult?.data?.orderId ?? '---'}</span>
              </div>
              <div className="vehicle-detail__success-row">
                <span className="vehicle-detail__success-label">Khách hàng</span>
                <span className="vehicle-detail__success-value">{bookingSuccess.customerInfo.name}</span>
              </div>
              <div className="vehicle-detail__success-row">
                <span className="vehicle-detail__success-label">Trạm nhận</span>
                <span className="vehicle-detail__success-value">
                  {bookingSuccess.vehicleSummary.selectedStation?.name ?? '---'}
                </span>
              </div>
              <div className="vehicle-detail__success-row">
                <span className="vehicle-detail__success-label">Thời gian</span>
                <span className="vehicle-detail__success-value">
                  {formatDateTimeDisplay(bookingSuccess.schedule.startTime)} &rarr; {formatDateTimeDisplay(bookingSuccess.schedule.endTime)}
                </span>
              </div>
              <div className="vehicle-detail__success-row">
                <span className="vehicle-detail__success-label">Hình thức</span>
                <span className="vehicle-detail__success-value">
                  {bookingSuccess.paymentMethod === 'deposit' ? 'Đặt cọc 30%' : 'Thanh toán toàn bộ'}
                </span>
              </div>
              <div className="vehicle-detail__success-row">
                <span className="vehicle-detail__success-label">Tổng chi phí</span>
                <span className="vehicle-detail__success-value vehicle-detail__success-value--highlight">
                  {formatCurrency(bookingSuccess.orderResult?.data?.totalPrice ?? bookingSuccess.totalAmount)}
                </span>
              </div>
            </div>

            <div className="vehicle-detail__success-actions">
              <button type="button" className="btn btn--primary" onClick={handleCloseSuccessModal}>
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="vehicle-detail__background" />
      <div className="container">
        {fetchError && (
          <div className="vehicle-detail__alert">
            {fetchError}
          </div>
        )}
        <div className="vehicle-detail__header">
          <button onClick={onBack} className="vehicle-detail__back-btn">
            <ArrowLeft size={20} />
            Quay lại
          </button>

          <div className="vehicle-detail__header-tags">
            <span className="vehicle-detail__chip">{detail.type_name}</span>
            {detail.manufacturer && <span className="vehicle-detail__chip">{detail.manufacturer}</span>}
            {detail.modelId && (
              <span className="vehicle-detail__chip vehicle-detail__chip--muted">ID #{detail.modelId}</span>
            )}
          </div>
        </div>

        <section className="vehicle-detail__overview">
          <div className="vehicle-detail__image-card">
            {detail.img ? (
              <img src={detail.img} alt={detail.name} className="vehicle-detail__image" />
            ) : (
              <div className="vehicle-detail__image-placeholder">
                <Car size={110} />
              </div>
            )}

            <div className="vehicle-detail__image-meta">
              <div className={`vehicle-detail__status-badge status-${statusClass}`}>
                <Sparkles size={20} className="status-icon success" />
                <span>{statusText}</span>
              </div>
              <div className="vehicle-detail__price-chip">
                <span className="vehicle-detail__price-chip-label">Giá thuê / giờ</span>
                <strong>{formatCurrency(detail.price_per_hour)}</strong>
              </div>
            </div>
          </div>

          <div className="vehicle-detail__summary">
            <div className="vehicle-detail__summary-top">
              <h1 className="vehicle-detail__title">{detail.name}</h1>
              <p className="vehicle-detail__subtitle">
                {typeInfo?.description || detail.typeDescription || 'Mẫu xe điện tiện lợi cho di chuyển trong thành phố với chi phí tối ưu.'}
              </p>
            </div>

            <div className="vehicle-detail__quick-stats">
              {quickStats.map((stat) => (
                <div key={stat.label} className="vehicle-detail__quick-stat">
                  <stat.icon size={18} className="vehicle-detail__quick-stat-icon" />
                  <div>
                    <span className="vehicle-detail__quick-stat-label">{stat.label}</span>
                    <span className="vehicle-detail__quick-stat-value">{stat.value}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="vehicle-detail__cta">
              {userRole === 'customer' ? (
                <button
                  className={`btn btn--primary btn--large ${!canRent ? 'btn--disabled' : ''}`}
                  onClick={() => setIsBookingModalOpen(true)}
                  disabled={!canRent}
                >
                  {canRent ? 'Đặt xe ngay' : 'Không khả dụng'}
                </button>
              ) : (
                <button className="btn btn--secondary btn--large" onClick={() => onRentVehicle(detail)}>
                  Xem chi tiết vận hành
                </button>
              )}

              <button className="btn btn--ghost btn--large">
                Liên hệ tư vấn
              </button>
            </div>
          </div>
        </section>

        <section className="vehicle-detail__details-grid">
          <div className="vehicle-detail__card vehicle-detail__card--specs">
            <h3 className="vehicle-detail__card-title">Thông số kỹ thuật</h3>
            <ul className="vehicle-detail__spec-list">
              {specifications.map((spec) => (
                <li key={spec.label} className="vehicle-detail__spec-item">
                  <span className="vehicle-detail__spec-label">{spec.label}</span>
                  <span className="vehicle-detail__spec-value">{spec.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="vehicle-detail__card vehicle-detail__card--highlights">
            <h3 className="vehicle-detail__card-title">Điểm nổi bật</h3>
            <ul className="vehicle-detail__highlight-list">
              {highlightFeatures.map((feature) => (
                <li key={feature.title} className="vehicle-detail__highlight-item">
                  <Sparkles size={18} className="vehicle-detail__highlight-icon" />
                  <div>
                    <span className="vehicle-detail__highlight-title">{feature.title}</span>
                    <p className="vehicle-detail__highlight-description">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="vehicle-detail__support-banner">
              <Shield size={22} className="vehicle-detail__support-icon" />
              <div>
                <span className="vehicle-detail__support-label">Hỗ trợ khách hàng</span>
                <p className="vehicle-detail__support-copy">Tư vấn sử dụng, bảo trì và các ưu đãi mới nhất.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="vehicle-detail__insights">
          {insightMetrics.map((metric) => (
            <div
              key={metric.title}
              className={`vehicle-detail__insight-card vehicle-detail__insight-card--${metric.tone}`}
            >
              <metric.icon size={22} className="vehicle-detail__insight-icon" />
              <div className="vehicle-detail__insight-body">
                <span className="vehicle-detail__insight-title">{metric.title}</span>
                <strong className="vehicle-detail__insight-value">{metric.value}</strong>
                <p className="vehicle-detail__insight-description">{metric.description}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="vehicle-detail__bottom">
          <div className="vehicle-detail__related">
            <div className="vehicle-detail__section-header">
              <div>
                <h3 className="vehicle-detail__section-title">Mẫu xe cùng phân khúc</h3>
                <p className="vehicle-detail__section-subtitle">Tham khảo thêm các mẫu xe thuộc cùng Vehicle Type.</p>
              </div>
              <button className="vehicle-detail__section-action" onClick={() => onRentVehicle(detail)}>
                Xem tất cả
              </button>
            </div>
            {relatedModels.length > 0 ? (
              <div className="vehicle-detail__related-grid">
                {relatedModels.map((model) => (
                  <div key={model.vehicle_id} className="vehicle-detail__related-card">
                    <NewVehicleCard
                      vehicle={model}
                      onRentVehicle={onRentVehicle}
                      userRole={userRole}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="vehicle-detail__related-empty">
                <p>Hiện chưa có mẫu xe cùng phân khúc. Vui lòng quay lại sau.</p>
              </div>
            )}
          </div>

          <div className="vehicle-detail__conditions">
            <div className="vehicle-detail__section-header">
              <div>
                <h3 className="vehicle-detail__section-title">Điều kiện thuê xe</h3>
                <p className="vehicle-detail__section-subtitle">Chuẩn bị thông tin cần thiết để hoàn tất đặt xe trong 2 phút.</p>
              </div>
            </div>

            <div className="vehicle-detail__condition-list">
              {rentalConditions.map((condition) => (
                <div key={condition.title} className="vehicle-detail__condition-item">
                  <condition.icon size={20} className="vehicle-detail__condition-icon" />
                  <div>
                    <h4 className="vehicle-detail__condition-title">{condition.title}</h4>
                    <p className="vehicle-detail__condition-description">{condition.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {detail && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          vehicle={detail}
          onConfirmBooking={handleBookingConfirm}
        />
      )}
    </div>
  );
};

export default VehicleDetail;
