import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Calendar, Car, ClipboardList, DollarSign, Hash, User, Wallet, X } from 'lucide-react';
import './OrderDetail.scss';
import { orderService, OrderRecord } from '../../services/orderService';
import { paymentService, FinalPriceSummary, FinalizeReturnResult } from '../../services/paymentService';
import { accountService } from '../../services/accountService';
import { vehicleService, damageReportService } from '../../services';
import type { Vehicle, DamageLevel, DamageReportRecord } from '../../services';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const formatCurrencyVND = (value?: number | null) => {
  if (typeof value !== 'number') {
    return '--';
  }
  return currencyFormatter.format(Math.max(value, 0));
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('vi-VN', { hour12: false, dateStyle: 'medium', timeStyle: 'short' });
};

const statusMeta: Record<string, { label: string; tone: 'pending' | 'processing' | 'success' | 'danger' | 'neutral' }> = {
  PENDING: { label: 'Chờ xử lý', tone: 'pending' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'processing' },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'processing' },
  ONGOING: { label: 'Đang thuê', tone: 'processing' },
  COMPLETED: { label: 'Hoàn tất', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
  REJECTED: { label: 'Từ chối', tone: 'danger' },
};

interface DamageFormState {
  description: string;
  damageLevel: DamageLevel;
  estimatedCost: string;
  img: string;
}

const createDamageFormState = (): DamageFormState => ({
  description: '',
  damageLevel: 'MINOR',
  estimatedCost: '',
  img: '',
});

const DAMAGE_LEVEL_OPTIONS: Array<{ value: DamageLevel; label: string; subtitle: string }> = [
  { value: 'MINOR', label: 'Mức độ nhẹ', subtitle: 'Trầy xước nhỏ hoặc hư hỏng không ảnh hưởng vận hành' },
  { value: 'MODERATE', label: 'Mức độ vừa', subtitle: 'Hư hỏng cần sửa chữa nhưng xe vẫn hoạt động' },
  { value: 'SEVERE', label: 'Mức độ nặng', subtitle: 'Thiệt hại lớn ảnh hưởng trực tiếp đến an toàn/vận hành' },
];

interface OrderDetailProps {
  order: OrderRecord | null;
  onBack: () => void;
  onOrderUpdated?: (order: OrderRecord) => void;
}

const OrderDetail: React.FC<OrderDetailProps> = ({ order, onBack, onOrderUpdated }) => {
  const [currentOrder, setCurrentOrder] = useState<OrderRecord | null>(order);
  const [processingAction, setProcessingAction] = useState<'start' | 'complete' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [finalPriceSummary, setFinalPriceSummary] = useState<FinalPriceSummary | null>(null);
  const [paymentResult, setPaymentResult] = useState<FinalizeReturnResult | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isFinalizingPayment, setIsFinalizingPayment] = useState(false);
  const [paymentFeedback, setPaymentFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accountLookup, setAccountLookup] = useState<Record<string, string>>({});
  const [showDamageReportForm, setShowDamageReportForm] = useState(false);
  const [damageForm, setDamageForm] = useState<DamageFormState>(() => createDamageFormState());
  const [damageFormFeedback, setDamageFormFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingDamage, setIsSubmittingDamage] = useState(false);
  const [damageReportResult, setDamageReportResult] = useState<DamageReportRecord | null>(null);
  const [isDamageModalOpen, setIsDamageModalOpen] = useState(false);
  const [showVehicleUpdateForm, setShowVehicleUpdateForm] = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<{ batteryLevel: string; status: string }>({ batteryLevel: '', status: 'AVAILABLE' });
  const [vehicleFormFeedback, setVehicleFormFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmittingVehicle, setIsSubmittingVehicle] = useState(false);
  const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
  const [vehicleLoadError, setVehicleLoadError] = useState<string | null>(null);

  const previousOrderIdRef = useRef<string | null | undefined>(undefined);

  const resetStateForOrder = useCallback(() => {
    setProcessingAction(null);
    setFeedback(null);
    setFinalPriceSummary(null);
    setPaymentResult(null);
    setIsPaymentModalOpen(false);
    setIsFinalizingPayment(false);
    setPaymentFeedback(null);
    setShowDamageReportForm(false);
    setDamageForm(createDamageFormState());
    setDamageFormFeedback(null);
    setIsSubmittingDamage(false);
    setDamageReportResult(null);
  setIsDamageModalOpen(false);
    setShowVehicleUpdateForm(false);
    setVehicleDetails(null);
    setVehicleForm({ batteryLevel: '', status: 'AVAILABLE' });
    setVehicleFormFeedback(null);
    setIsSubmittingVehicle(false);
    setIsLoadingVehicle(false);
    setVehicleLoadError(null);
  }, []);

  useEffect(() => {
    const incomingOrderId = order?.orderId ?? null;
    const previousOrderId = previousOrderIdRef.current;

    setCurrentOrder(order);

    if (previousOrderId === undefined || incomingOrderId !== previousOrderId) {
      previousOrderIdRef.current = incomingOrderId;
      resetStateForOrder();
    }
  }, [order, resetStateForOrder]);

  useEffect(() => {
    let mounted = true;

    const loadAccounts = async () => {
      try {
        const accounts = await accountService.getAccounts();
        if (!mounted) {
          return;
        }

        const lookup = accounts.reduce<Record<string, string>>((map, account) => {
          const displayName = account.username || account.email || account.accountId;
          map[account.accountId] = displayName;
          return map;
        }, {});

        setAccountLookup(lookup);
      } catch (error) {
        console.error('Không thể tải danh sách tài khoản:', error);
      }
    };

    loadAccounts();

    return () => {
      mounted = false;
    };
  }, []);

  const loadVehicleDetails = useCallback(
    async (vehicleId: string) => {
      setIsLoadingVehicle(true);
      setVehicleLoadError(null);

      try {
        const detail = await vehicleService.getVehicleById(vehicleId);
        setVehicleDetails(detail);
        setVehicleForm({
          batteryLevel: typeof detail.batteryLevel === 'number' ? detail.batteryLevel.toString() : '',
          status: detail.status?.toUpperCase() ?? 'AVAILABLE',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể tải thông tin phương tiện.';
        setVehicleLoadError(message);
      } finally {
        setIsLoadingVehicle(false);
      }
    },
    []
  );

  const selectedDamageLevelMeta = useMemo(
    () => DAMAGE_LEVEL_OPTIONS.find((option) => option.value === damageForm.damageLevel),
    [damageForm.damageLevel]
  );

  const handleDamageFieldChange = useCallback((field: keyof DamageFormState, value: string) => {
    setDamageForm((prev) => ({
      ...prev,
      [field]: field === 'damageLevel' ? (value as DamageLevel) : value,
    }));
  }, []);

  const handleDamageFormSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!currentOrder?.orderId || !currentOrder.vehicleId) {
        return;
      }

      const description = damageForm.description.trim();
      if (!description) {
        setDamageFormFeedback({ type: 'error', text: 'Vui lòng ghi rõ mô tả hư hại.' });
        return;
      }

      const costInput = damageForm.estimatedCost.trim();
      if (!costInput) {
        setDamageFormFeedback({ type: 'error', text: 'Vui lòng nhập chi phí ước tính.' });
        return;
      }

      const estimatedCost = Number(costInput);
      if (!Number.isFinite(estimatedCost) || estimatedCost < 0) {
        setDamageFormFeedback({ type: 'error', text: 'Chi phí ước tính phải là số không âm.' });
        return;
      }

      setIsSubmittingDamage(true);
      setDamageFormFeedback(null);

      try {
        const response = await damageReportService.createDamageReport({
          orderId: currentOrder.orderId,
          vehicleId: currentOrder.vehicleId,
          description,
          damageLevel: damageForm.damageLevel,
          estimatedCost,
          img: damageForm.img.trim() || undefined,
        });

        setDamageReportResult(response.record);
        setFeedback({ type: 'success', text: response.message });
        setShowDamageReportForm(true);
        setIsDamageModalOpen(false);
        setDamageForm(createDamageFormState());

        try {
          const finalPriceResponse = await paymentService.calculateFinalPrice(currentOrder.orderId);
          setFinalPriceSummary(finalPriceResponse.data);
          setPaymentResult(null);
          setPaymentFeedback(null);
          setIsPaymentModalOpen(true);
        } catch (priceError) {
          const priceMessage = priceError instanceof Error ? priceError.message : 'Không thể tính giá cuối cùng.';
          setFeedback({ type: 'error', text: priceMessage });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể lưu biên bản hư hại.';
        setDamageFormFeedback({ type: 'error', text: message });
      } finally {
        setIsSubmittingDamage(false);
      }
    },
    [currentOrder, damageForm.damageLevel, damageForm.description, damageForm.estimatedCost, damageForm.img]
  );

  const handleSkipDamageStep = useCallback(async () => {
    if (!currentOrder?.orderId) {
      return;
    }

    setIsSubmittingDamage(true);
    setDamageFormFeedback(null);

    try {
      const finalPriceResponse = await paymentService.calculateFinalPrice(currentOrder.orderId);
      setFinalPriceSummary(finalPriceResponse.data);
      setPaymentResult(null);
      setPaymentFeedback(null);
      setIsPaymentModalOpen(true);
      setShowDamageReportForm(true);
      setIsDamageModalOpen(false);
      setDamageReportResult(null);
      setDamageForm(createDamageFormState());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tính giá cuối cùng.';
      setDamageFormFeedback({ type: 'error', text: message });
    } finally {
      setIsSubmittingDamage(false);
    }
  }, [currentOrder]);

  const handleOpenDamageModal = useCallback(() => {
    if (!currentOrder?.vehicleId) {
      return;
    }

    setShowDamageReportForm(true);
    setIsDamageModalOpen(true);
    setDamageFormFeedback(null);
  }, [currentOrder?.vehicleId]);

  const handleCloseDamageModal = useCallback(() => {
    setIsDamageModalOpen(false);
  }, []);

  const hiddenVehiclePayload = useMemo(() => {
    if (!vehicleDetails) {
      return null;
    }

    return {
      stationId: vehicleDetails.stationId ?? null,
      modelId: vehicleDetails.modelId,
      serialNumber: vehicleDetails.serialNumber,
      color: vehicleDetails.color ?? null,
      batteryCapacity: vehicleDetails.batteryCapacity ?? null,
      range: vehicleDetails.range ?? null,
      img: vehicleDetails.img ?? null,
      lastMaintenance: vehicleDetails.lastMaintenance ?? null,
    };
  }, [vehicleDetails]);

  const handleVehicleFieldChange = useCallback((field: 'batteryLevel' | 'status', value: string) => {
    setVehicleForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  const handleVehicleUpdateSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!currentOrder?.vehicleId || !vehicleDetails) {
        return;
      }

      const numericBattery = vehicleForm.batteryLevel.trim() === '' ? null : Number(vehicleForm.batteryLevel);

      if (numericBattery !== null && (Number.isNaN(numericBattery) || numericBattery < 0 || numericBattery > 100)) {
        setVehicleFormFeedback({ type: 'error', text: 'Mức pin phải nằm trong khoảng 0 - 100%.' });
        return;
      }

      setIsSubmittingVehicle(true);
      setVehicleFormFeedback(null);

      try {
        const payload = {
          stationId: hiddenVehiclePayload?.stationId ?? null,
          modelId: vehicleDetails.modelId,
          serialNumber: vehicleDetails.serialNumber,
          status: vehicleForm.status,
          color: hiddenVehiclePayload?.color ?? vehicleDetails.color ?? null,
          batteryLevel: numericBattery,
          batteryCapacity: hiddenVehiclePayload?.batteryCapacity ?? vehicleDetails.batteryCapacity ?? null,
          range: hiddenVehiclePayload?.range ?? vehicleDetails.range ?? null,
          img: hiddenVehiclePayload?.img ?? vehicleDetails.img ?? null,
          lastMaintenance: hiddenVehiclePayload?.lastMaintenance ?? vehicleDetails.lastMaintenance ?? null,
          isactive: vehicleDetails.isactive ?? vehicleDetails.isActive ?? true,
        };

        const updatedVehicle = await vehicleService.updateVehicle(currentOrder.vehicleId, payload);

        setVehicleDetails(updatedVehicle);
        setVehicleForm({
          batteryLevel: typeof updatedVehicle.batteryLevel === 'number' ? updatedVehicle.batteryLevel.toString() : '',
          status: updatedVehicle.status?.toUpperCase() ?? vehicleForm.status,
        });
        setVehicleFormFeedback({ type: 'success', text: 'Cập nhật phương tiện thành công.' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Không thể cập nhật phương tiện.';
        setVehicleFormFeedback({ type: 'error', text: message });
      } finally {
        setIsSubmittingVehicle(false);
      }
    },
    [currentOrder?.vehicleId, hiddenVehiclePayload, vehicleDetails, vehicleForm.batteryLevel, vehicleForm.status]
  );

  if (!currentOrder) {
    return (
      <div className="order-detail">
        <button type="button" className="order-detail__back-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          <span>Quay lại</span>
        </button>
        <div className="order-detail__empty">
          <h2>Không tìm thấy đơn hàng</h2>
          <p>Vui lòng chọn một đơn hàng từ danh sách để xem chi tiết.</p>
        </div>
      </div>
    );
  }

  const statusKey = currentOrder.status?.toUpperCase() ?? 'UNKNOWN';
  const meta = statusMeta[statusKey] ?? { label: statusKey, tone: 'neutral' as const };
  const canActivate = statusKey === 'CONFIRMED';
  const canComplete = statusKey === 'ONGOING';

  const orderCodeDisplay = currentOrder.orderCode ?? currentOrder.orderId;
  const customerDisplayName = accountLookup[currentOrder.customerId] ?? currentOrder.customerId;

  const handleStartOrder = async () => {
    if (!currentOrder) {
      return;
    }

    setProcessingAction('start');
    setFeedback(null);

    try {
      const response = await orderService.startOrder(currentOrder.orderId);
      const updatedData = response.data ?? null;

      if (!updatedData) {
        throw new Error('Không có dữ liệu đơn hàng sau khi kích hoạt.');
      }

      const updatedOrder: OrderRecord = {
        ...currentOrder,
        ...updatedData,
      };

      setCurrentOrder(updatedOrder);
      onOrderUpdated?.(updatedOrder);
      setFeedback({ type: 'success', text: response.message ?? 'Đơn hàng đã được kích hoạt.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể kích hoạt đơn hàng.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleCompleteOrder = async () => {
    if (!currentOrder) {
      return;
    }

    setProcessingAction('complete');
    setFeedback(null);

    try {
      const response = await orderService.updateReturnTime(currentOrder.orderId);
      const data = response.data ?? null;

      if (!data) {
        throw new Error('Không có dữ liệu trả về từ hệ thống.');
      }

      const updatedOrder: OrderRecord = {
        ...currentOrder,
        status: data.orderStatus ?? currentOrder.status,
        returnTime: data.returnTime ?? currentOrder.returnTime,
        updatedAt: new Date().toISOString(),
        isactive: false,
      };

      setCurrentOrder(updatedOrder);
      onOrderUpdated?.(updatedOrder);

      setFeedback({ type: 'success', text: response.message ?? 'Đơn hàng đã được hoàn tất.' });
      setFinalPriceSummary(null);
      setPaymentResult(null);
      setPaymentFeedback(null);
      setIsPaymentModalOpen(false);

      if (updatedOrder.vehicleId) {
        setShowDamageReportForm(true);
        setDamageForm(createDamageFormState());
        setDamageFormFeedback(null);
        setIsSubmittingDamage(false);
        setDamageReportResult(null);
        setIsDamageModalOpen(true);
        return;
      }

      try {
        const finalPriceResponse = await paymentService.calculateFinalPrice(updatedOrder.orderId);
        setFinalPriceSummary(finalPriceResponse.data);
        setPaymentResult(null);
        setPaymentFeedback(null);
        setIsPaymentModalOpen(true);
      } catch (priceError) {
        const message = priceError instanceof Error ? priceError.message : 'Không thể tính giá cuối cùng.';
        setFeedback({ type: 'error', text: message });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể cập nhật thời gian trả xe.';
      setFeedback({ type: 'error', text: message });
    } finally {
      setProcessingAction(null);
    }
  };

  const handleFinalizeReturnPayment = async () => {
    if (!currentOrder || !finalPriceSummary) {
      return;
    }

    setIsFinalizingPayment(true);
    setPaymentFeedback(null);

    try {
      const response = await paymentService.finalizeReturn({
        accountId: currentOrder.customerId,
        amount: finalPriceSummary.finalPrice,
        finalPaymentMethod: 'WALLET',
      });

      setPaymentResult(response.data);
      setPaymentFeedback({ type: 'success', text: response.message ?? 'Thanh toán hoàn tất.' });

      if (currentOrder.vehicleId) {
        await loadVehicleDetails(currentOrder.vehicleId);
        setShowVehicleUpdateForm(true);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể hoàn tất thanh toán.';
      setPaymentFeedback({ type: 'error', text: message });
    } finally {
      setIsFinalizingPayment(false);
    }
  };

  return (
    <div className="order-detail">
      <button type="button" className="order-detail__back-btn" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>Quay lại</span>
      </button>

      <header className="order-detail__header">
        <div>
          <h2 className="order-detail__title">Chi tiết đơn đặt xe</h2>
          <p className="order-detail__subtitle">{orderCodeDisplay}</p>
        </div>
        <div className="order-detail__status-group">
          <span className={`order-detail__status order-detail__status--${meta.tone}`}>{meta.label}</span>
          <span className={`order-detail__active order-detail__active--${currentOrder.isactive ? 'active' : 'inactive'}`}>
            {currentOrder.isactive ? 'Đang kích hoạt' : 'Đã vô hiệu'}
          </span>
        </div>
      </header>

      {(canActivate || canComplete) && (
        <div className="order-detail__actions">
          {canActivate && (
            <button
              type="button"
              className="order-detail__action-btn"
              onClick={handleStartOrder}
              disabled={processingAction !== null}
            >
              {processingAction === 'start' ? 'Đang kích hoạt...' : 'Kích hoạt đơn'}
            </button>
          )}
          {canComplete && (
            <button
              type="button"
              className="order-detail__action-btn order-detail__action-btn--complete"
              onClick={handleCompleteOrder}
              disabled={processingAction !== null}
            >
              {processingAction === 'complete' ? 'Đang hoàn tất...' : 'Hoàn tất đơn'}
            </button>
          )}
        </div>
      )}

      {feedback && (
        <div className={`order-detail__alert order-detail__alert--${feedback.type}`}>
          {feedback.text}
        </div>
      )}

      {showDamageReportForm && currentOrder.vehicleId && (
        <div className="order-detail__damage-trigger">
          <div className="order-detail__damage-trigger-info">
            <AlertTriangle size={22} />
            <span>Đơn cần biên bản hư hại trước khi xác nhận phí hoàn trả.</span>
          </div>
          <button
            type="button"
            className="order-detail__damage-trigger-btn"
            onClick={handleOpenDamageModal}
            disabled={isDamageModalOpen}
          >
            {damageReportResult ? 'Cập nhật biên bản hư hại' : 'Tạo biên bản hư hại'}
          </button>
        </div>
      )}

      {showDamageReportForm && currentOrder.vehicleId && isDamageModalOpen && (
        <div className="order-detail__damage-overlay" role="dialog" aria-modal="true">
          <div className="order-detail__damage-modal">
            <button
              type="button"
              className="order-detail__damage-close"
              onClick={handleCloseDamageModal}
              aria-label="Đóng"
              disabled={isSubmittingDamage}
            >
              <X size={16} />
            </button>
            <div className="order-detail__damage-header">
              <AlertTriangle size={26} />
              <div>
                <h3>Ghi nhận biên bản hư hại</h3>
                <p>Vui lòng hoàn tất biên bản trước khi tính phí hoàn trả cho đơn.</p>
              </div>
            </div>

            <form className="order-detail__damage-form" onSubmit={handleDamageFormSubmit}>
              <div className="order-detail__damage-grid">
                <div className="order-detail__damage-field order-detail__damage-field--wide">
                  <label htmlFor="damage-description">Mô tả chi tiết</label>
                  <textarea
                    id="damage-description"
                    value={damageForm.description}
                    onChange={(event) => handleDamageFieldChange('description', event.target.value)}
                    placeholder="Ví dụ: Trầy nhẹ bên hông phải, sơn xước dài khoảng 10cm"
                    rows={3}
                    disabled={isSubmittingDamage}
                  />
                  <span className="order-detail__damage-hint">Ghi rõ vị trí, mức độ và ảnh hưởng tới khả năng vận hành.</span>
                </div>

                <div className="order-detail__damage-field">
                  <label htmlFor="damage-level">Mức độ hư hại</label>
                  <select
                    id="damage-level"
                    value={damageForm.damageLevel}
                    onChange={(event) => handleDamageFieldChange('damageLevel', event.target.value)}
                    disabled={isSubmittingDamage}
                  >
                    {DAMAGE_LEVEL_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {selectedDamageLevelMeta && (
                    <span className="order-detail__damage-hint">{selectedDamageLevelMeta.subtitle}</span>
                  )}
                </div>

                <div className="order-detail__damage-field">
                  <label htmlFor="damage-estimated-cost">Chi phí ước tính (VND)</label>
                  <input
                    id="damage-estimated-cost"
                    type="number"
                    min={0}
                    step={1000}
                    value={damageForm.estimatedCost}
                    onChange={(event) => handleDamageFieldChange('estimatedCost', event.target.value)}
                    placeholder="Ví dụ: 750000"
                    disabled={isSubmittingDamage}
                  />
                </div>

                <div className="order-detail__damage-field">
                  <label htmlFor="damage-img">Ảnh minh họa (URL)</label>
                  <input
                    id="damage-img"
                    type="url"
                    value={damageForm.img}
                    onChange={(event) => handleDamageFieldChange('img', event.target.value)}
                    placeholder="https://example.com/hinh-anh-hu-hai.jpg"
                    disabled={isSubmittingDamage}
                  />
                  <span className="order-detail__damage-hint">Tùy chọn. Dùng đường dẫn đến ảnh đã tải lên hệ thống.</span>
                </div>
              </div>

              {damageFormFeedback && (
                <div className={`order-detail__damage-alert order-detail__damage-alert--${damageFormFeedback.type}`}>
                  {damageFormFeedback.text}
                </div>
              )}

              <div className="order-detail__damage-actions">
                <button type="submit" className="order-detail__damage-submit" disabled={isSubmittingDamage}>
                  {isSubmittingDamage ? 'Đang lưu biên bản...' : 'Lưu biên bản & tính phí'}
                </button>
                <button
                  type="button"
                  className="order-detail__damage-secondary"
                  onClick={handleSkipDamageStep}
                  disabled={isSubmittingDamage}
                >
                  Không có hư hại
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {!showDamageReportForm && damageReportResult && (
        <section className="order-detail__section order-detail__damage-summary">
          <div className="order-detail__damage-summary-header">
            <ClipboardList size={24} />
            <div>
              <h3>Biên bản hư hại đã lưu</h3>
              <p>
                Phương tiện {damageReportResult.vehicleId} · Ghi nhận lúc {formatDateTime(damageReportResult.createdAt)}
              </p>
            </div>
          </div>

          <dl className="order-detail__damage-summary-grid">
            <div>
              <dt>Mức độ</dt>
              <dd>
                {DAMAGE_LEVEL_OPTIONS.find((option) => option.value === damageReportResult.damageLevel)?.label ??
                  damageReportResult.damageLevel}
              </dd>
            </div>
            <div>
              <dt>Chi phí ước tính</dt>
              <dd>{formatCurrencyVND(damageReportResult.estimatedCost)}</dd>
            </div>
            <div className="order-detail__damage-summary-description">
              <dt>Mô tả</dt>
              <dd>{damageReportResult.description}</dd>
            </div>
            {damageReportResult.img && (
              <div>
                <dt>Ảnh minh họa</dt>
                <dd>
                  <a href={damageReportResult.img} target="_blank" rel="noreferrer">
                    Xem ảnh
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {isPaymentModalOpen && finalPriceSummary && (
        <div className="order-detail__payment-overlay" role="dialog" aria-modal="true">
          <div className="order-detail__payment-modal">
            <button
              type="button"
              className="order-detail__payment-close"
              onClick={() => setIsPaymentModalOpen(false)}
              aria-label="Đóng"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="order-detail__payment-header">
              <Wallet size={28} />
              <div>
                <h3>Thanh toán hoàn tất đơn</h3>
                <p>Xác nhận trừ tiền ví sau khi hệ thống tính các khoản phí phát sinh.</p>
              </div>
            </div>
            <div className="order-detail__payment-body">
              <dl className="order-detail__payment-summary">
                <div>
                  <dt>Mã đơn</dt>
                  <dd>{orderCodeDisplay}</dd>
                </div>
                <div>
                  <dt>Khách hàng</dt>
                  <dd>{customerDisplayName}</dd>
                </div>
                <div className="order-detail__payment-amount">
                  <dt>Số tiền phải thanh toán</dt>
                  <dd>{formatCurrencyVND(finalPriceSummary.finalPrice)}</dd>
                </div>
                <div>
                  <dt>Đơn vị tiền tệ</dt>
                  <dd>{finalPriceSummary.currency}</dd>
                </div>
              </dl>

              {paymentResult && (
                <div className="order-detail__payment-result">
                  <strong>Trạng thái: {paymentResult.paymentStatus}</strong>
                  <span>{paymentResult.message ?? 'Thanh toán thành công.'}</span>
                </div>
              )}

              {paymentFeedback && (
                <div className={`order-detail__payment-alert order-detail__payment-alert--${paymentFeedback.type}`}>
                  {paymentFeedback.text}
                </div>
              )}
            </div>
            <div className="order-detail__payment-actions">
              <button
                type="button"
                className="order-detail__payment-secondary"
                onClick={() => setIsPaymentModalOpen(false)}
                disabled={isFinalizingPayment}
              >
                Đóng
              </button>
              <button
                type="button"
                className="order-detail__payment-primary"
                onClick={handleFinalizeReturnPayment}
                disabled={isFinalizingPayment || Boolean(paymentResult)}
              >
                {isFinalizingPayment ? 'Đang thanh toán...' : 'Thanh toán'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="order-detail__section">
        <h3 className="order-detail__section-title">Thông tin đơn hàng</h3>
        <dl className="order-detail__grid">
          <div className="order-detail__cell">
            <dt><Hash size={16} /> Mã đơn</dt>
            <dd>{orderCodeDisplay}</dd>
          </div>
          <div className="order-detail__cell">
            <dt><Calendar size={16} /> Ngày đặt</dt>
            <dd>{formatDateTime(currentOrder.orderDate)}</dd>
          </div>
          <div className="order-detail__cell">
            <dt><Calendar size={16} /> Bắt đầu</dt>
            <dd>{formatDateTime(currentOrder.startTime)}</dd>
          </div>
          <div className="order-detail__cell">
            <dt><Calendar size={16} /> Kết thúc</dt>
            <dd>{formatDateTime(currentOrder.endTime)}</dd>
          </div>
          <div className="order-detail__cell">
            <dt><Calendar size={16} /> Trả thực tế</dt>
            <dd>{formatDateTime(currentOrder.returnTime)}</dd>
          </div>
        </dl>
      </section>

      <section className="order-detail__section">
        <h3 className="order-detail__section-title">Khách hàng &amp; phương tiện</h3>
        <dl className="order-detail__grid">
          <div className="order-detail__cell">
            <dt><User size={16} /> Khách hàng</dt>
            <dd>{customerDisplayName}</dd>
          </div>
          <div className="order-detail__cell">
            <dt><Car size={16} /> Phương tiện</dt>
            <dd>{currentOrder.vehicleModelName ?? currentOrder.vehicleId}</dd>
          </div>
          <div className="order-detail__cell">
            <dt><Car size={16} /> Mã phương tiện</dt>
            <dd>{currentOrder.vehicleId}</dd>
          </div>
          <div className="order-detail__cell">
            <dt><Hash size={16} /> Khuyến mãi</dt>
            <dd>{currentOrder.promotionId ?? 'Không áp dụng'}</dd>
          </div>
        </dl>
      </section>

      <section className="order-detail__section">
        <h3 className="order-detail__section-title">Chi phí</h3>
        <dl className="order-detail__grid">
          <div className="order-detail__cell">
            <dt><DollarSign size={16} /> Giá gốc</dt>
            <dd>{formatCurrencyVND(currentOrder.basePrice)}</dd>
          </div>
          <div className="order-detail__cell">
            <dt><DollarSign size={16} /> Tổng tiền</dt>
            <dd>{formatCurrencyVND(currentOrder.totalPrice)}</dd>
          </div>
          <div className="order-detail__cell">
            <dt><DollarSign size={16} /> Giá giờ</dt>
            <dd>{formatCurrencyVND(currentOrder.pricePerHour)}</dd>
          </div>
          <div className="order-detail__cell">
            <dt><DollarSign size={16} /> Giảm giá</dt>
            <dd>{currentOrder.discountAmount ? formatCurrencyVND(currentOrder.discountAmount) : 'Không có'}</dd>
          </div>
        </dl>
      </section>

      {showVehicleUpdateForm && (
        <section className="order-detail__section order-detail__vehicle-section">
          <h3 className="order-detail__section-title">Cập nhật trạng thái phương tiện</h3>
          <p className="order-detail__vehicle-description">
            Vui lòng xác nhận lại thông tin phương tiện sau khi hoàn tất thanh toán. Các trường khác đã được hệ thống điền sẵn và ẩn.
          </p>

          {isLoadingVehicle && <div className="order-detail__vehicle-loading">Đang tải dữ liệu phương tiện...</div>}

          {vehicleLoadError && !isLoadingVehicle && (
            <div className="order-detail__vehicle-alert order-detail__vehicle-alert--error">
              <span>{vehicleLoadError}</span>
              {currentOrder.vehicleId && (
                <button type="button" onClick={() => loadVehicleDetails(currentOrder.vehicleId)}>
                  Thử lại
                </button>
              )}
            </div>
          )}

          {vehicleFormFeedback && (
            <div className={`order-detail__vehicle-alert order-detail__vehicle-alert--${vehicleFormFeedback.type}`}>
              {vehicleFormFeedback.text}
            </div>
          )}

          {vehicleDetails && !isLoadingVehicle && !vehicleLoadError && (
            <form className="order-detail__vehicle-form" onSubmit={handleVehicleUpdateSubmit}>
              <div className="order-detail__vehicle-grid">
                <div className="order-detail__vehicle-field">
                  <label htmlFor="vehicle-battery">Mức pin (%)</label>
                  <input
                    id="vehicle-battery"
                    type="number"
                    min={0}
                    max={100}
                    value={vehicleForm.batteryLevel}
                    onChange={(event) => handleVehicleFieldChange('batteryLevel', event.target.value)}
                    placeholder="Ví dụ: 80"
                  />
                </div>

                <div className="order-detail__vehicle-field">
                  <label htmlFor="vehicle-status">Trạng thái</label>
                  <select
                    id="vehicle-status"
                    value={vehicleForm.status}
                    onChange={(event) => handleVehicleFieldChange('status', event.target.value)}
                  >
                    <option value="AVAILABLE">Sẵn sàng</option>
                    <option value="MAINTENANCE">Bảo trì</option>
                    <option value="CHARGING">Đang sạc</option>
                  </select>
                </div>
              </div>

              {hiddenVehiclePayload &&
                Object.entries(hiddenVehiclePayload).map(([key, value]) => (
                  <input key={key} type="hidden" name={key} value={value === null ? '' : String(value)} />
                ))}

              <div className="order-detail__vehicle-actions">
                <button type="submit" className="order-detail__vehicle-submit" disabled={isSubmittingVehicle}>
                  {isSubmittingVehicle ? 'Đang cập nhật...' : 'Cập nhật phương tiện'}
                </button>
                {currentOrder.vehicleId && (
                  <button
                    type="button"
                    className="order-detail__vehicle-reload"
                    onClick={() => loadVehicleDetails(currentOrder.vehicleId!)}
                    disabled={isSubmittingVehicle}
                  >
                    Tải lại
                  </button>
                )}
              </div>
            </form>
          )}
        </section>
      )}
    </div>
  );
};

export default OrderDetail;
