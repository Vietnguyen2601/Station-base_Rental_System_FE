import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './Profile.scss';
import { User } from '../../types';
import { orderService, BookOrderData } from '../../services/orderService';

interface ProfileProps {
  user: User;
  onViewWallet?: () => void;
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const formatCurrencyVND = (value: number) => {
  if (!Number.isFinite(value)) {
    return '--';
  }
  return currencyFormatter.format(Math.max(value, 0));
};

const formatDateTime = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) {
    return '--';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  return date.toLocaleString('vi-VN', {
    hour12: false,
    ...options,
  });
};

const STATUS_META: Record<string, { label: string; tone: 'pending' | 'info' | 'success' | 'danger' | 'neutral' }> = {
  PENDING: { label: 'Chờ xác nhận', tone: 'pending' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'info' },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'info' },
  COMPLETED: { label: 'Hoàn tất', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
  REJECTED: { label: 'Bị từ chối', tone: 'danger' },
};

const Profile: React.FC<ProfileProps> = ({ user, onViewWallet }) => {
  const [orders, setOrders] = useState<BookOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await orderService.getMyOrders();
      setOrders(response.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải lịch sử đặt xe. Vui lòng thử lại sau.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, user.id]);

  const stats = useMemo(() => {
    if (!orders.length) {
      return {
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalSpent: 0,
      };
    }

    const pendingOrders = orders.filter((order) => order.status?.toUpperCase() === 'PENDING').length;
    const completedOrders = orders.filter((order) => order.status?.toUpperCase() === 'COMPLETED').length;
    const cancelledOrders = orders.filter((order) => order.status?.toUpperCase() === 'CANCELLED').length;
    const totalSpent = orders.reduce((sum, order) => sum + (order.totalPrice ?? 0), 0);

    return {
      totalOrders: orders.length,
      pendingOrders,
      completedOrders,
      cancelledOrders,
      totalSpent,
    };
  }, [orders]);

  const displayName = user.name ?? user.username;
  const initials = displayName ? displayName.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase();
  const createdAtText = user.createdAt
    ? formatDateTime(
        typeof user.createdAt === 'string'
          ? user.createdAt
          : user.createdAt.toISOString(),
        { dateStyle: 'medium' }
      )
    : undefined;

  return (
    <div className="profile">
      <div className="profile__container">
        <section className="profile__header-card">
          <div className="profile__identity">
            <div className="profile__avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="profile__identity-info">
              <h1 className="profile__name">{displayName}</h1>
              <p className="profile__email">{user.email}</p>
              <div className="profile__tags">
                <span className="profile__tag">Khách hàng</span>
                {user.contactNumber && <span className="profile__tag profile__tag--muted">{user.contactNumber}</span>}
                {createdAtText && <span className="profile__tag profile__tag--ghost">Tham gia {createdAtText}</span>}
              </div>
            </div>
          </div>

          <div className="profile__summary">
            <div className="profile__summary-card">
              <span className="profile__summary-label">Tổng số đơn</span>
              <strong className="profile__summary-value">{stats.totalOrders}</strong>
            </div>
            <div className="profile__summary-card">
              <span className="profile__summary-label">Đang chờ</span>
              <strong className="profile__summary-value">{stats.pendingOrders}</strong>
            </div>
            <div className="profile__summary-card">
              <span className="profile__summary-label">Hoàn tất</span>
              <strong className="profile__summary-value">{stats.completedOrders}</strong>
            </div>
            <div className="profile__summary-card">
              <span className="profile__summary-label">Tổng chi tiêu</span>
              <strong className="profile__summary-value">{formatCurrencyVND(stats.totalSpent)}</strong>
            </div>
          </div>
        </section>

        {onViewWallet && (
          <div className="profile__wallet-cta">
            <button type="button" className="profile__wallet-btn" onClick={onViewWallet}>
              Xem ví của tôi
            </button>
          </div>
        )}

        <section className="profile__orders">
          <div className="profile__orders-header">
            <div>
              <h2 className="profile__orders-title">Lịch sử đặt xe</h2>
              <p className="profile__orders-subtitle">Theo dõi các chuyến đi bạn đã đặt và trạng thái xử lý hiện tại.</p>
            </div>
            <button type="button" className="profile__refresh-btn" onClick={loadOrders}>
              Làm mới
            </button>
          </div>

          {isLoading ? (
            <div className="profile__state">Đang tải dữ liệu đặt xe...</div>
          ) : error ? (
            <div className="profile__state profile__state--error">{error}</div>
          ) : orders.length === 0 ? (
            <div className="profile__state profile__state--empty">Bạn chưa có đơn đặt xe nào.</div>
          ) : (
            <div className="profile__orders-list">
              {orders.map((order) => {
                const statusKey = order.status?.toUpperCase() ?? 'UNKNOWN';
                const statusMeta = STATUS_META[statusKey] ?? { label: statusKey, tone: 'neutral' as const };
                const shortOrderId = order.orderId.slice(0, 8);
                const displayOrderCode = order.orderCode ?? shortOrderId;

                return (
                  <article key={order.orderId} className="profile__order-card">
                    <header className="profile__order-header">
                      <div>
                        <span className="profile__order-id">Mã đơn: {displayOrderCode}</span>
                        {order.orderCode && <span className="profile__order-code">(ID: {shortOrderId})</span>}
                        <span className="profile__order-model">{order.vehicleModelName}</span>
                      </div>
                      <span className={`profile__status profile__status--${statusMeta.tone}`}>
                        {statusMeta.label}
                      </span>
                    </header>

                    <div className="profile__order-grid">
                      <div className="profile__order-group">
                        <span className="profile__order-label">Thời gian thuê</span>
                        <span className="profile__order-value">
                          {formatDateTime(order.startTime, { dateStyle: 'short', timeStyle: 'short' })}
                          {' -> '}
                          {formatDateTime(order.endTime, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <div className="profile__order-group">
                        <span className="profile__order-label">Mã đặt xe</span>
                        <span className="profile__order-value">{displayOrderCode}</span>
                      </div>
                      <div className="profile__order-group">
                        <span className="profile__order-label">Ngày đặt</span>
                        <span className="profile__order-value">{formatDateTime(order.orderDate, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      {order.promotionCode && (
                        <div className="profile__order-group">
                          <span className="profile__order-label">Mã khuyến mãi</span>
                          <span className="profile__order-value">{order.promotionCode}</span>
                        </div>
                      )}
                      <div className="profile__order-group">
                        <span className="profile__order-label">Trả thực tế</span>
                        <span className="profile__order-value">
                          {formatDateTime(order.returnTime, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>

                    <footer className="profile__order-footer">
                      <div className="profile__order-total">
                        <span className="profile__order-label">Tổng chi phí</span>
                        <strong className="profile__order-total-value">{formatCurrencyVND(order.totalPrice)}</strong>
                      </div>
                      {order.discountAmount ? (
                        <span className="profile__order-discount">- {formatCurrencyVND(order.discountAmount)}</span>
                      ) : null}
                    </footer>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Profile;
