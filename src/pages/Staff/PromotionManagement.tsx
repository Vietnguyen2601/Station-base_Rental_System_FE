import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  Clock,
  Percent,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner/LoadingSpinner';
import {
  Promotion,
  promotionService
} from '../../services/promotionService';
import './PromotionManagement.scss';

type PromotionFormState = {
  promoCode: string;
  discountPercentage: string;
  startDate: string;
  endDate: string;
};

type PromotionStatus = {
  label: string;
  tone: 'success' | 'info' | 'danger' | 'neutral';
};

const toDateTimeLocal = (date: Date): string => {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 16);
};

const toApiDateTime = (value: string): string => {
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

const createDefaultFormState = (): PromotionFormState => {
  const now = new Date();
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    promoCode: '',
    discountPercentage: '10',
    startDate: toDateTimeLocal(now),
    endDate: toDateTimeLocal(nextWeek)
  };
};

const formatDateTime = (value: string): string => {
  if (!value) {
    return 'Không xác định';
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return 'Không xác định';
  }

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
};

const getPromotionStatus = (promotion: Promotion): PromotionStatus => {
  const now = Date.now();
  const start = new Date(promotion.startDate).getTime();
  const end = new Date(promotion.endDate).getTime();

  if (!promotion.isActive) {
    return {
      label: 'Không hoạt động',
      tone: 'neutral'
    };
  }

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return {
      label: 'Không xác định',
      tone: 'neutral'
    };
  }

  if (now < start) {
    return {
      label: 'Sắp diễn ra',
      tone: 'info'
    };
  }

  if (now > end) {
    return {
      label: 'Đã hết hạn',
      tone: 'danger'
    };
  }

  return {
    label: 'Đang áp dụng',
    tone: 'success'
  };
};

const PromotionManagement: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState<PromotionFormState>(() => createDefaultFormState());

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await promotionService.getPromotions();
      setPromotions(response.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách mã giảm giá.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPromotions();
  }, [fetchPromotions]);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage(null);
    }, 3800);

    return () => window.clearTimeout(timeoutId);
  }, [successMessage]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    setFormState((prev) => ({
      ...prev,
      [name]: name === 'promoCode' ? value.toUpperCase() : value
    }));
  };

  const validateForm = (): string | null => {
    const code = formState.promoCode.trim();
    const discount = Number(formState.discountPercentage);
    const start = new Date(formState.startDate);
    const end = new Date(formState.endDate);

    if (!code) {
      return 'Vui lòng nhập mã giảm giá.';
    }

    if (!/^([A-Z0-9]{3,20})$/.test(code)) {
      return 'Mã giảm giá chỉ gồm chữ in hoa và số (3-20 ký tự).';
    }

    if (Number.isNaN(discount) || discount <= 0 || discount > 90) {
      return 'Mức giảm phải lớn hơn 0% và không quá 90%.';
    }

    if (!formState.startDate || Number.isNaN(start.getTime())) {
      return 'Vui lòng chọn thời gian bắt đầu hợp lệ.';
    }

    if (!formState.endDate || Number.isNaN(end.getTime())) {
      return 'Vui lòng chọn thời gian kết thúc hợp lệ.';
    }

    if (end <= start) {
      return 'Thời gian kết thúc phải sau thời gian bắt đầu.';
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationMessage = validateForm();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const payload = {
        promoCode: formState.promoCode.trim().toUpperCase(),
        discountPercentage: Number(formState.discountPercentage),
        startDate: toApiDateTime(formState.startDate),
        endDate: toApiDateTime(formState.endDate)
      };

      if (!payload.startDate || !payload.endDate) {
        throw new Error('Không thể chuyển đổi thời gian khuyến mại.');
      }

      const response = await promotionService.createPromotion(payload);
      const successText = response.message ?? 'Tạo mã giảm giá thành công!';

      setSuccessMessage(successText);
      setFormState(createDefaultFormState());
      await fetchPromotions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo mã giảm giá. Vui lòng thử lại sau.';
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const stats = useMemo(() => {
    const total = promotions.length;
    let active = 0;
    let upcoming = 0;
    let expired = 0;
    let inactive = 0;

    const now = Date.now();

    promotions.forEach((promotion) => {
      const start = new Date(promotion.startDate).getTime();
      const end = new Date(promotion.endDate).getTime();

      if (!promotion.isActive) {
        inactive += 1;
        return;
      }

      if (Number.isNaN(start) || Number.isNaN(end)) {
        return;
      }

      if (now < start) {
        upcoming += 1;
      } else if (now > end) {
        expired += 1;
      } else {
        active += 1;
      }
    });

    return { total, active, upcoming, expired, inactive };
  }, [promotions]);

  return (
    <section className="promotion-management">
      <header className="promotion-management__header">
        <div>
          <h1 className="promotion-management__title">Quản lý mã giảm giá</h1>
          <p className="promotion-management__subtitle">
            Theo dõi trạng thái mã giảm giá và tạo chương trình ưu đãi cho khách hàng.
          </p>
        </div>
        <button
          type="button"
          className="promotion-management__refresh-btn"
          disabled={loading}
          onClick={() => void fetchPromotions()}
        >
          <RefreshCw size={18} />
          Làm mới
        </button>
      </header>

      <section className="promotion-management__overview">
        <article className="promotion-management__stat-card promotion-management__stat-card--total">
          <span className="promotion-management__stat-label">Tổng số mã</span>
          <span className="promotion-management__stat-value">{stats.total}</span>
        </article>
        <article className="promotion-management__stat-card">
          <span className="promotion-management__stat-label">Đang áp dụng</span>
          <span className="promotion-management__stat-value">{stats.active}</span>
        </article>
        <article className="promotion-management__stat-card">
          <span className="promotion-management__stat-label">Sắp diễn ra</span>
          <span className="promotion-management__stat-value">{stats.upcoming}</span>
        </article>
        <article className="promotion-management__stat-card">
          <span className="promotion-management__stat-label">Đã hết hạn</span>
          <span className="promotion-management__stat-value">{stats.expired}</span>
        </article>
        <article className="promotion-management__stat-card">
          <span className="promotion-management__stat-label">Không hoạt động</span>
          <span className="promotion-management__stat-value">{stats.inactive}</span>
        </article>
      </section>

      {error && (
        <div className="promotion-management__alert promotion-management__alert--error" role="alert">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="promotion-management__alert promotion-management__alert--success" role="status">
          {successMessage}
        </div>
      )}

      <section className="promotion-management__form-card">
        <div className="promotion-management__form-header">
          <div>
            <h2 className="promotion-management__form-title">Tạo mã giảm giá mới</h2>
            <p className="promotion-management__form-subtitle">
              Nhập thông tin chương trình để áp dụng ưu đãi cho khách hàng thân thiết.
            </p>
          </div>
          <Sparkles className="promotion-management__form-icon" size={28} />
        </div>

        <form className="promotion-management__form" onSubmit={handleSubmit}>
          <div className="promotion-management__form-grid">
            <label className="promotion-management__form-field">
              <span>Mã giảm giá</span>
              <input
                required
                name="promoCode"
                placeholder="VD: EVSPRING24"
                value={formState.promoCode}
                onChange={handleInputChange}
              />
            </label>
            <label className="promotion-management__form-field">
              <span>Phần trăm giảm</span>
              <input
                required
                name="discountPercentage"
                type="number"
                min={1}
                max={90}
                step={1}
                placeholder="VD: 15"
                value={formState.discountPercentage}
                onChange={handleInputChange}
              />
            </label>
            <label className="promotion-management__form-field">
              <span>Thời gian bắt đầu</span>
              <input
                required
                name="startDate"
                type="datetime-local"
                value={formState.startDate}
                onChange={handleInputChange}
              />
            </label>
            <label className="promotion-management__form-field">
              <span>Thời gian kết thúc</span>
              <input
                required
                name="endDate"
                type="datetime-local"
                value={formState.endDate}
                onChange={handleInputChange}
              />
            </label>
          </div>

          <button
            type="submit"
            className="promotion-management__submit-btn"
            disabled={creating}
          >
            <Percent size={18} />
            {creating ? 'Đang tạo...' : 'Tạo mã giảm giá'}
          </button>
        </form>
      </section>

      <section>
        <header className="promotion-management__form-header">
          <div>
            <h2 className="promotion-management__form-title">Danh sách mã giảm giá</h2>
            <p className="promotion-management__form-subtitle">
              Thống kê trạng thái để tối ưu chiến dịch khuyến mãi.
            </p>
          </div>
          <CalendarClock size={26} className="promotion-management__form-icon" />
        </header>

        {loading ? (
          <div className="promotion-management__state">
            <LoadingSpinner size="sm" />
            <p>Đang tải mã giảm giá...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="promotion-management__state promotion-management__state--empty">
            <Clock size={22} />
            <p>Chưa có chương trình giảm giá nào. Hãy tạo mã mới để bắt đầu.</p>
          </div>
        ) : (
          <div className="promotion-management__table-wrapper">
            <table className="promotion-management__table">
              <thead>
                <tr>
                  <th>Mã</th>
                  <th>Giảm (%)</th>
                  <th>Trạng thái</th>
                  <th>Thời gian bắt đầu</th>
                  <th>Thời gian kết thúc</th>
                  <th>Kích hoạt</th>
                </tr>
              </thead>
              <tbody>
                {promotions.map((promotion) => {
                  const status = getPromotionStatus(promotion);

                  return (
                    <tr key={`${promotion.promoCode}-${promotion.startDate}`}>
                      <td>
                        <span className="promotion-management__code">{promotion.promoCode}</span>
                      </td>
                      <td>{promotion.discountPercentage}%</td>
                      <td>
                        <span className={`promotion-management__status promotion-management__status--${status.tone}`}>
                          {status.label}
                        </span>
                      </td>
                      <td>{formatDateTime(promotion.startDate)}</td>
                      <td>{formatDateTime(promotion.endDate)}</td>
                      <td>
                        <span
                          className={`promotion-management__badge ${promotion.isActive ? 'promotion-management__badge--active' : 'promotion-management__badge--inactive'}`}
                        >
                          {promotion.isActive ? 'Đang bật' : 'Tạm tắt'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
};

export default PromotionManagement;
