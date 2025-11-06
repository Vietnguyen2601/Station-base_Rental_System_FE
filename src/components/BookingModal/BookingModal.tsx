import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  CreditCard,
  Shield,
  MapPin,
  Loader2,
  AlertCircle,
  CheckCircle,
  PencilLine,
} from 'lucide-react';
import { NewVehicleCardData } from '../../types';
import { stationService } from '../../services/stationService';
import type { StationByModelRecord } from '../../services/stationService';
import { vehicleService } from '../../services/vehicleService';
import type { HighestBatteryVehicle } from '../../services/vehicleService';
import { orderService } from '../../services/orderService';
import type { BookOrderData } from '../../services/orderService';
import './BookingModal.scss';

type PaymentMethod = 'deposit' | 'full';

type ScheduleInfo = {
  stationId: string;
  startTime: string;
  endTime: string;
  promotionCode: string;
};

type AgreementInfo = {
  acceptPolicy: boolean;
  confirmAccuracy: boolean;
  signature: string;
};

export type BookingSummary = {
  schedule: {
    stationId: string;
    startTime: string;
    endTime: string;
    durationHours: number;
    promotionCode?: string;
  };
  paymentMethod: PaymentMethod;
  totalAmount: number;
  vehicleSummary: {
    baseVehicle: NewVehicleCardData;
    assignedVehicle: HighestBatteryVehicle | null;
    selectedStation: StationByModelRecord | null;
  };
  orderResult: OrderResultSummary;
};

type OrderResultSummary = {
  statusCode: number;
  message: string;
  data: BookOrderData;
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: NewVehicleCardData;
  onConfirmBooking: (bookingData: BookingSummary) => void;
}

type ErrorState = Record<string, string>;

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const formatCurrency = (value: number) => currencyFormatter.format(Math.max(0, value));

const toLocalDateTimeInput = (date: Date) => {
  const timezoneOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - timezoneOffset * 60_000);
  return local.toISOString().slice(0, 16);
};

const toApiDateTime = (value: string) => {
  if (!value) {
    return '';
  }

  if (value.length === 16) {
    return `${value}:00`;
  }

  if (value.length === 19) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  const seconds = `${date.getSeconds()}`.padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

const formatDateTime = (value: string) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('vi-VN', {
    hour12: false,
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, vehicle, onConfirmBooking }) => {
  const modelId = vehicle.modelId ?? vehicle.vehicle_id;

  const [schedule, setSchedule] = useState<ScheduleInfo>({
    stationId: '',
    startTime: '',
    endTime: '',
    promotionCode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('deposit');
  const [agreements, setAgreements] = useState<AgreementInfo>({
    acceptPolicy: false,
    confirmAccuracy: false,
    signature: '',
  });

  const [errors, setErrors] = useState<ErrorState>({});
  const [apiFeedback, setApiFeedback] = useState<string | null>(null);

  const [stations, setStations] = useState<StationByModelRecord[]>([]);
  const [stationsLoading, setStationsLoading] = useState(false);
  const [stationsError, setStationsError] = useState<string | null>(null);

  const [vehicleCandidate, setVehicleCandidate] = useState<HighestBatteryVehicle | null>(null);
  const [vehicleLoading, setVehicleLoading] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  const [orderLoading, setOrderLoading] = useState(false);

  const clearError = useCallback((field: string) => {
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const defaultStart = new Date();
    defaultStart.setMinutes(defaultStart.getMinutes() + 30);

    const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000);

    setSchedule({
      stationId: '',
      startTime: toLocalDateTimeInput(defaultStart),
      endTime: toLocalDateTimeInput(defaultEnd),
      promotionCode: '',
    });
    setPaymentMethod('deposit');
    setAgreements({ acceptPolicy: false, confirmAccuracy: false, signature: '' });
    setErrors({});
    setApiFeedback(null);
  }, [isOpen, vehicle.vehicle_id, vehicle.modelId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!modelId) {
      setStations([]);
      setStationsError('Không tìm thấy thông tin mẫu xe, vui lòng thử lại.');
      return;
    }

    let isMounted = true;

    const fetchStations = async () => {
      try {
        setStationsLoading(true);
        setStationsError(null);
        const data = await stationService.getStationsByModel(modelId);
        if (!isMounted) {
          return;
        }
        setStations(data);
        setSchedule((prev) => ({ ...prev, stationId: '' }));
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setStations([]);
        console.error('Failed to load stations for model:', error);
        const message =
          error instanceof Error
            ? error.message
            : 'Không thể tải danh sách trạm, vui lòng thử lại.';
        setStationsError(
          message.includes('chưa đăng nhập')
            ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để xem danh sách trạm.'
            : message
        );
      } finally {
        if (isMounted) {
          setStationsLoading(false);
        }
      }
    };

    fetchStations();

    return () => {
      isMounted = false;
    };
  }, [isOpen, modelId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (!modelId || !schedule.stationId) {
      setVehicleCandidate(null);
      setVehicleError(null);
      return;
    }

    let isMounted = true;

    const fetchVehicle = async () => {
      try {
        setVehicleLoading(true);
        setVehicleError(null);
        const data = await vehicleService.getHighestBatteryVehicle(modelId, schedule.stationId);
        if (!isMounted) {
          return;
        }
        setVehicleCandidate(data);
        clearError('vehicle');
      } catch {
        if (!isMounted) {
          return;
        }
        setVehicleCandidate(null);
        setVehicleError('Tạm thời chưa có xe phù hợp tại trạm này. Vui lòng chọn trạm khác.');
      } finally {
        if (isMounted) {
          setVehicleLoading(false);
        }
      }
    };

    fetchVehicle();

    return () => {
      isMounted = false;
    };
  }, [clearError, isOpen, modelId, schedule.stationId]);

  const durationHours = useMemo(() => {
    if (!schedule.startTime || !schedule.endTime) {
      return 0;
    }

    const start = new Date(schedule.startTime);
    const end = new Date(schedule.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 0;
    }

    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) {
      return 0;
    }

    return Math.max(1, Math.ceil(diffMs / (60 * 60 * 1000)));
  }, [schedule.endTime, schedule.startTime]);

  const totalAmount = useMemo(() => durationHours * (vehicle.price_per_hour ?? 0), [durationHours, vehicle.price_per_hour]);
  const depositAmount = useMemo(() => Math.round(totalAmount * 0.3), [totalAmount]);

  const selectedStation = useMemo(
    () => stations.find((station) => station.stationId === schedule.stationId) ?? null,
    [schedule.stationId, stations],
  );

  const validateForm = () => {
    const validationErrors: ErrorState = {};

    if (!schedule.stationId) {
      validationErrors.stationId = 'Vui lòng chọn trạm nhận xe.';
    }

    if (!schedule.startTime || !schedule.endTime) {
      validationErrors.time = 'Vui lòng chọn thời gian nhận và trả xe.';
    } else if (durationHours <= 0) {
      validationErrors.time = 'Thời gian kết thúc phải lớn hơn thời gian bắt đầu.';
    }

    if (!vehicleCandidate) {
      validationErrors.vehicle = 'Chưa có xe phù hợp, vui lòng chọn trạm khác.';
    }

    if (!agreements.acceptPolicy) {
      validationErrors.acceptPolicy = 'Bạn cần đồng ý với điều khoản sử dụng.';
    }

    if (!agreements.confirmAccuracy) {
      validationErrors.confirmAccuracy = 'Vui lòng xác nhận thông tin đã chính xác.';
    }

    if (!agreements.signature.trim()) {
      validationErrors.signature = 'Vui lòng ký xác nhận.';
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const handleStationSelect = (stationId: string) => {
    setSchedule((prev) => ({ ...prev, stationId }));
    clearError('stationId');
  };

  const handleDateChange = (field: keyof Pick<ScheduleInfo, 'startTime' | 'endTime'>, value: string) => {
    setSchedule((prev) => ({ ...prev, [field]: value }));
    clearError('time');
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!vehicleCandidate) {
      return;
    }

    try {
      setApiFeedback(null);
      setOrderLoading(true);

      const apiStartTime = toApiDateTime(schedule.startTime);
      const apiEndTime = toApiDateTime(schedule.endTime);

      if (!apiStartTime || !apiEndTime) {
        throw new Error('Thời gian đặt xe không hợp lệ.');
      }

      const payload = {
        vehicleId: vehicleCandidate.vehicleId,
        startTime: apiStartTime,
        endTime: apiEndTime,
        promotionCode: schedule.promotionCode.trim() || undefined,
        paymentMethod,
      };

      const orderResponse = await orderService.bookOrder(payload);

      if (!orderResponse || !orderResponse.data || orderResponse.statusCode < 200 || orderResponse.statusCode >= 300) {
        throw new Error(orderResponse?.message ?? 'Đặt xe thất bại');
      }

      const orderResult: OrderResultSummary = {
        statusCode: orderResponse.statusCode,
        message: orderResponse.message,
        data: orderResponse.data,
      };

      onConfirmBooking({
        schedule: {
          stationId: schedule.stationId,
          startTime: apiStartTime,
          endTime: apiEndTime,
          durationHours,
          promotionCode: schedule.promotionCode.trim() || undefined,
        },
        paymentMethod,
        totalAmount,
        vehicleSummary: {
          baseVehicle: vehicle,
          assignedVehicle: vehicleCandidate,
          selectedStation,
        },
        orderResult,
      });

      onClose();
    } catch (error) {
      console.error('Failed to book order:', error);
      setApiFeedback('Đặt xe không thành công, vui lòng thử lại sau.');
    } finally {
      setOrderLoading(false);
    }
  };

  const isSubmitDisabled =
    orderLoading ||
    stationsLoading ||
    vehicleLoading ||
    !schedule.stationId ||
    durationHours <= 0 ||
    !vehicleCandidate ||
    !agreements.acceptPolicy ||
    !agreements.confirmAccuracy ||
    !agreements.signature.trim();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="booking-modal-overlay">
      <div className="booking-modal">
        <header className="booking-modal__header">
          <div>
            <h2 className="booking-modal__title">Đặt xe - {vehicle.name}</h2>
            <p className="booking-modal__subtitle">
              Hoàn tất thông tin đặt xe, chọn trạm nhận và xác nhận cam kết trước khi gửi yêu cầu.
            </p>
          </div>
          <button type="button" className="booking-modal__close" onClick={onClose} aria-label="Đóng">
            <X size={20} />
          </button>
        </header>

        <div className="booking-modal__body">
          <section className="booking-modal__column">
            <div className="booking-modal__panel">
              <div className="booking-modal__panel-header">
                <MapPin size={20} />
                <div>
                  <h3 className="booking-modal__panel-title">Chọn trạm & thời gian</h3>
                  <p className="booking-modal__panel-description">Lựa chọn trạm nhận xe phù hợp cùng thời gian nhận - trả xe.</p>
                </div>
              </div>

              {stationsLoading ? (
                <div className="booking-modal__loader">
                  <Loader2 size={24} className="spinner" />
                  Đang tải danh sách trạm...
                </div>
              ) : stationsError ? (
                <div className="booking-modal__alert">
                  <AlertCircle size={18} />
                  {stationsError}
                </div>
              ) : (
                <>
                  <label className="form-group form-group--full">
                    <span className="form-label">Chọn trạm nhận xe *</span>
                    <select
                      className={`form-input ${errors.stationId ? 'form-input--error' : ''}`}
                      value={schedule.stationId}
                      onChange={(event) => handleStationSelect(event.target.value)}
                    >
                      <option value="">-- Chọn trạm --</option>
                      {stations.map((station) => (
                        <option key={station.stationId} value={station.stationId}>
                          {station.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  {stations.length > 0 ? (
                    <div className="station-list">
                      {stations.map((station) => {
                        const isSelected = station.stationId === schedule.stationId;
                        return (
                          <button
                            key={station.stationId}
                            type="button"
                            className={`station-card ${isSelected ? 'station-card--selected' : ''}`}
                            onClick={() => handleStationSelect(station.stationId)}
                          >
                            <div className="station-card__header">
                              <span className="station-card__name">{station.name}</span>
                              {isSelected ? (
                                <span className="station-card__badge station-card__badge--active">Đã chọn</span>
                              ) : (
                                <span className="station-card__badge">Sẵn sàng</span>
                              )}
                            </div>
                            <p className="station-card__address">{station.address}</p>
                            <div className="station-card__meta">
                              <span>{station.availableVehicleCount} xe khả dụng</span>
                              <span>Sức chứa {station.capacity}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="booking-modal__hint">Chưa có trạm khả dụng cho mẫu xe này.</p>
                  )}
                </>
              )}

              {errors.stationId && !stationsLoading && (
                <div className="error-message error-message--inline">
                  <AlertCircle size={14} />
                  {errors.stationId}
                </div>
              )}

              <div className="time-grid">
                <label className="form-group">
                  <span className="form-label">
                    <Calendar size={16} /> Thời gian nhận xe *
                  </span>
                  <input
                    type="datetime-local"
                    className={`form-input ${errors.time ? 'form-input--error' : ''}`}
                    value={schedule.startTime}
                    onChange={(event) => handleDateChange('startTime', event.target.value)}
                  />
                </label>
                <label className="form-group">
                  <span className="form-label">
                    <Clock size={16} /> Thời gian trả xe *
                  </span>
                  <input
                    type="datetime-local"
                    className={`form-input ${errors.time ? 'form-input--error' : ''}`}
                    value={schedule.endTime}
                    min={schedule.startTime}
                    onChange={(event) => handleDateChange('endTime', event.target.value)}
                  />
                </label>
              </div>

              {errors.time && (
                <div className="error-message error-message--inline">
                  <AlertCircle size={14} />
                  {errors.time}
                </div>
              )}

              <label className="form-group form-group--full">
                <span className="form-label">Mã khuyến mại</span>
                <input
                  className="form-input"
                  placeholder="Nhập nếu bạn có"
                  value={schedule.promotionCode}
                  onChange={(event) => setSchedule((prev) => ({ ...prev, promotionCode: event.target.value }))}
                />
              </label>
            </div>

            <div className="booking-modal__panel">
              <div className="booking-modal__panel-header">
                <CreditCard size={20} />
                <div>
                  <h3 className="booking-modal__panel-title">Hình thức thanh toán</h3>
                  <p className="booking-modal__panel-description">Chọn cách thanh toán phù hợp để giữ xe.</p>
                </div>
              </div>

              <div className="payment-options">
                <button
                  type="button"
                  className={`payment-option ${paymentMethod === 'deposit' ? 'payment-option--active' : ''}`}
                  onClick={() => {
                    setPaymentMethod('deposit');
                    clearError('paymentMethod');
                  }}
                >
                  <div>
                    <h4>Đặt cọc 30%</h4>
                    <p>Giữ xe trong 12 giờ, thanh toán phần còn lại khi nhận xe.</p>
                  </div>
                  <span className="payment-option__amount">{formatCurrency(depositAmount)}</span>
                </button>

                <button
                  type="button"
                  className={`payment-option ${paymentMethod === 'full' ? 'payment-option--active' : ''}`}
                  onClick={() => {
                    setPaymentMethod('full');
                    clearError('paymentMethod');
                  }}
                >
                  <div>
                    <h4>Thanh toán toàn bộ</h4>
                    <p>Đảm bảo xe luôn sẵn sàng ở trạng thái tốt nhất khi bạn nhận.</p>
                  </div>
                  <span className="payment-option__amount">{formatCurrency(totalAmount)}</span>
                </button>
              </div>
            </div>

            <div className="booking-modal__panel">
              <div className="booking-modal__panel-header">
                <Shield size={20} />
                <div>
                  <h3 className="booking-modal__panel-title">Cam kết trước khi đặt xe</h3>
                  <p className="booking-modal__panel-description">Vui lòng đọc kỹ và xác nhận các điều khoản dưới đây.</p>
                </div>
              </div>

              <ul className="commitment-list">
                <li>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreements.acceptPolicy}
                      onChange={(event) => {
                        setAgreements((prev) => ({ ...prev, acceptPolicy: event.target.checked }));
                        clearError('acceptPolicy');
                      }}
                    />
                    Tôi đã đọc và đồng ý với điều khoản sử dụng và chính sách bảo mật của hệ thống.
                  </label>
                  {errors.acceptPolicy && (
                    <span className="error-message">
                      <AlertCircle size={14} />
                      {errors.acceptPolicy}
                    </span>
                  )}
                </li>
                <li>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={agreements.confirmAccuracy}
                      onChange={(event) => {
                        setAgreements((prev) => ({ ...prev, confirmAccuracy: event.target.checked }));
                        clearError('confirmAccuracy');
                      }}
                    />
                    Tôi xác nhận các thông tin cung cấp là chính xác và chịu trách nhiệm khi có sai lệch.
                  </label>
                  {errors.confirmAccuracy && (
                    <span className="error-message">
                      <AlertCircle size={14} />
                      {errors.confirmAccuracy}
                    </span>
                  )}
                </li>
              </ul>

              <label className="form-group form-group--full">
                <span className="form-label">
                  <PencilLine size={16} /> Ký xác nhận *
                </span>
                <input
                  className={`form-input ${errors.signature ? 'form-input--error' : ''}`}
                  placeholder="Nhập họ tên để ký xác nhận"
                  value={agreements.signature}
                  onChange={(event) => {
                    setAgreements((prev) => ({ ...prev, signature: event.target.value }));
                    clearError('signature');
                  }}
                />
                {errors.signature && (
                  <span className="error-message">
                    <AlertCircle size={14} />
                    {errors.signature}
                  </span>
                )}
              </label>
            </div>
          </section>

          <aside className="booking-modal__column booking-modal__column--summary">
            <div className="summary-card">
              <div className="summary-card__header">
                <CheckCircle size={20} />
                <div>
                  <h3>Thông tin tổng hợp</h3>
                  <p>Xem lại xe, trạm và chi phí trước khi xác nhận.</p>
                </div>
              </div>

              <div className="summary-card__body">
                <div className="vehicle-preview">
                  {vehicle.img ? <img src={vehicle.img} alt={vehicle.name} /> : <div className="vehicle-preview__placeholder">Không có ảnh</div>}
                  <div>
                    <h4>{vehicle.name}</h4>
                    <p>
                      {vehicle.type_name}
                      {vehicle.manufacturer ? ` • ${vehicle.manufacturer}` : ''}
                    </p>
                  </div>
                </div>

                <div className="summary-section">
                  <h5>Thời gian thuê</h5>
                  <ul className="summary-list">
                    <li className="summary-row">
                      <span>Nhận xe</span>
                      <span>{formatDateTime(schedule.startTime)}</span>
                    </li>
                    <li className="summary-row">
                      <span>Trả xe</span>
                      <span>{formatDateTime(schedule.endTime)}</span>
                    </li>
                    <li className="summary-row">
                      <span>Thời lượng</span>
                      <span>{durationHours > 0 ? `${durationHours} giờ` : '--'}</span>
                    </li>
                  </ul>
                </div>

                <div className="summary-section">
                  <h5>Trạm nhận xe</h5>
                  {selectedStation ? (
                    <ul className="summary-list">
                      <li className="summary-row">
                        <span>Tên trạm</span>
                        <span>{selectedStation.name}</span>
                      </li>
                      <li className="summary-row">
                        <span>Địa chỉ</span>
                        <span>{selectedStation.address}</span>
                      </li>
                      <li className="summary-row">
                        <span>Xe khả dụng</span>
                        <span>
                          {selectedStation.availableVehicleCount}/{selectedStation.capacity}
                        </span>
                      </li>
                    </ul>
                  ) : (
                    <p className="summary-empty">Chưa chọn trạm nhận xe.</p>
                  )}
                </div>

                <div className="summary-section">
                  <h5>Xe được đề xuất</h5>
                  {vehicleLoading ? (
                    <div className="booking-modal__loader booking-modal__loader--inline">
                      <Loader2 size={20} className="spinner" /> Đang kiểm tra xe khả dụng...
                    </div>
                  ) : vehicleCandidate ? (
                    <div className="vehicle-candidate">
                      <div>
                        <p className="vehicle-candidate__name">{vehicleCandidate.modelName ?? vehicleCandidate.typeName}</p>
                        <p className="vehicle-candidate__meta">
                          PIN {vehicleCandidate.batteryLevel ?? '--'}%
                          {vehicleCandidate.serialNumber ? ` • ${vehicleCandidate.serialNumber}` : ''}
                        </p>
                      </div>
                      <span className="vehicle-candidate__status">Ưu tiên</span>
                    </div>
                  ) : vehicleError ? (
                    <div className="booking-modal__alert booking-modal__alert--inline">
                      <AlertCircle size={16} />
                      {vehicleError}
                    </div>
                  ) : (
                    <p className="summary-empty">Chọn trạm để xem xe phù hợp nhất.</p>
                  )}
                </div>

                <div className="summary-section">
                  <h5>Chi phí dự kiến</h5>
                  <ul className="summary-list">
                    <li className="summary-row">
                      <span>Giá theo giờ</span>
                      <span>{formatCurrency(vehicle.price_per_hour ?? 0)}</span>
                    </li>
                    <li className="summary-row">
                      <span>Thời lượng</span>
                      <span>{durationHours > 0 ? `${durationHours} giờ` : '--'}</span>
                    </li>
                    <li className="summary-row summary-row--emphasis">
                      <span>Tổng tạm tính</span>
                      <span>{formatCurrency(totalAmount)}</span>
                    </li>
                  </ul>

                  <div className="summary-highlight">
                    <CreditCard size={16} />
                    {paymentMethod === 'deposit' ? (
                      <span>
                        Đặt cọc cần thanh toán: <strong>{formatCurrency(depositAmount)}</strong>
                      </span>
                    ) : (
                      <span>
                        Thanh toán toàn bộ: <strong>{formatCurrency(totalAmount)}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {apiFeedback && (
                  <div className="booking-modal__alert booking-modal__alert--error">
                    <AlertCircle size={18} />
                    {apiFeedback}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="booking-modal__footer">
          <button type="button" className="secondary-button" onClick={onClose} disabled={orderLoading}>
            Hủy
          </button>
          <button type="button" className="primary-button" onClick={handleSubmit} disabled={isSubmitDisabled}>
            {orderLoading ? (
              <>
                <Loader2 size={18} className="spinner" /> Đang gửi yêu cầu...
              </>
            ) : (
              'Xác nhận & đặt xe'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
