import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Filter, Search } from 'lucide-react';
import './OrderManagement.scss';
import { orderService, OrderRecord } from '../../services/orderService';

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

const statusMeta: Record<string, { label: string; tone: 'pending' | 'processing' | 'success' | 'danger' | 'neutral' }> = {
  PENDING: { label: 'Chờ xử lý', tone: 'pending' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'processing' },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'processing' },
  ONGOING: { label: 'Đang thuê', tone: 'processing' },
  COMPLETED: { label: 'Hoàn tất', tone: 'success' },
  CANCELLED: { label: 'Đã hủy', tone: 'danger' },
  REJECTED: { label: 'Từ chối', tone: 'danger' },
};

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await orderService.getAllOrders();
      setOrders(response.data ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách đơn đặt xe.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStartOrder = useCallback(
    async (orderId: string) => {
      setProcessingOrderId(orderId);
      setActionMessage(null);

      try {
        const response = await orderService.startOrder(orderId);
        const updatedOrder = response.data;

        if (updatedOrder) {
          setOrders((prev) =>
            prev.map((order) => (order.orderId === updatedOrder.orderId ? { ...order, ...updatedOrder } : order))
          );
        } else {
          await loadOrders();
        }

        setActionMessage({ type: 'success', text: response.message ?? 'Đã xác nhận khách hàng nhận xe.' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể xác nhận giao xe. Vui lòng thử lại.';
        setActionMessage({ type: 'error', text: message });
      } finally {
        setProcessingOrderId(null);
      }
    },
    [loadOrders]
  );

  const filteredOrders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'all' || order.status?.toUpperCase() === statusFilter;
      if (!matchesStatus) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        order.orderId,
        order.orderCode ?? '',
        order.customerId,
        order.vehicleId,
        order.promotionId ?? '',
        order.status,
      ]
        .filter(Boolean)
        .map((value) => value!.toString().toLowerCase());

      return haystack.some((value) => value.includes(normalizedSearch));
    });
  }, [orders, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pending = orders.filter((order) => order.status?.toUpperCase() === 'PENDING').length;
    const completed = orders.filter((order) => order.status?.toUpperCase() === 'COMPLETED').length;
    const cancelled = orders.filter((order) => order.status?.toUpperCase() === 'CANCELLED').length;
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice ?? 0), 0);

    return { totalOrders, pending, completed, cancelled, totalRevenue };
  }, [orders]);

  return (
    <div className="order-management">
      <div className="order-management__header">
        <div>
          <h2 className="order-management__title">Quản lý đơn đặt xe</h2>
          <p className="order-management__subtitle">Theo dõi và xử lý các đơn đặt xe của khách hàng.</p>
        </div>
        <button
          type="button"
          className="order-management__refresh-btn"
          onClick={loadOrders}
          disabled={isLoading}
        >
          <RefreshCcw size={18} />
          <span>Làm mới</span>
        </button>
      </div>

      <div className="order-management__stats">
        <div className="order-management__stat">
          <span className="order-management__stat-label">Tổng đơn</span>
          <strong className="order-management__stat-value">{stats.totalOrders}</strong>
        </div>
        <div className="order-management__stat">
          <span className="order-management__stat-label">Đang chờ</span>
          <strong className="order-management__stat-value">{stats.pending}</strong>
        </div>
        <div className="order-management__stat">
          <span className="order-management__stat-label">Hoàn tất</span>
          <strong className="order-management__stat-value">{stats.completed}</strong>
        </div>
        <div className="order-management__stat">
          <span className="order-management__stat-label">Đã hủy</span>
          <strong className="order-management__stat-value">{stats.cancelled}</strong>
        </div>
        <div className="order-management__stat">
          <span className="order-management__stat-label">Doanh thu</span>
          <strong className="order-management__stat-value">{formatCurrencyVND(stats.totalRevenue)}</strong>
        </div>
      </div>

      <div className="order-management__toolbar">
        <div className="order-management__search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn, khách hàng, xe..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <div className="order-management__filters">
          <Filter size={16} />
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xử lý</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="IN_PROGRESS">Đang thực hiện</option>
            <option value="ONGOING">Đang thuê</option>
            <option value="COMPLETED">Hoàn tất</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
      </div>

      {actionMessage && (
        <div className={`order-management__alert order-management__alert--${actionMessage.type}`}>
          {actionMessage.text}
        </div>
      )}

      {isLoading ? (
        <div className="order-management__state">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="order-management__state order-management__state--error">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="order-management__state order-management__state--empty">Không tìm thấy đơn đặt xe phù hợp.</div>
      ) : (
        <div className="order-management__list">
          {filteredOrders.map((order) => {
            const statusKey = order.status?.toUpperCase() ?? 'UNKNOWN';
            const meta = statusMeta[statusKey] ?? { label: statusKey, tone: 'neutral' as const };
            const shortId = order.orderId.slice(0, 8);
            const displayOrderCode = order.orderCode ?? `Đơn #${shortId}`;
            const promotionText = order.promotionId ?? '—';
            const staffText = order.staffId ?? 'Chưa phân công';
            const basePriceText = formatCurrencyVND(order.basePrice);
            const totalPriceText = formatCurrencyVND(order.totalPrice);
            const discountText = typeof order.discountAmount === 'number' ? formatCurrencyVND(order.discountAmount) : '—';
            const originalPriceText = typeof order.originalPrice === 'number' ? formatCurrencyVND(order.originalPrice) : '—';
            const pricePerHourText = typeof order.pricePerHour === 'number' ? formatCurrencyVND(order.pricePerHour) : '—';
            const orderDateText = formatDateTime(order.orderDate, { dateStyle: 'short', timeStyle: 'short' });
            const startTimeText = formatDateTime(order.startTime, { dateStyle: 'short', timeStyle: 'short' });
            const endTimeText = formatDateTime(order.endTime, { dateStyle: 'short', timeStyle: 'short' });
            const returnTimeText = formatDateTime(order.returnTime, { dateStyle: 'short', timeStyle: 'short' });
            const createdAtText = formatDateTime(order.createdAt, { dateStyle: 'short', timeStyle: 'short' });
            const updatedAtText = formatDateTime(order.updatedAt, { dateStyle: 'short', timeStyle: 'short' });

            return (
              <article key={order.orderId} className="order-management__card">
                <header className="order-management__card-header">
                  <div className="order-management__identity">
                    <h3 className="order-management__card-code">{displayOrderCode}</h3>
                    <p className="order-management__card-id">ID hệ thống: {order.orderId}</p>
                    <p className="order-management__card-meta">
                      Khách hàng: <span>{order.customerId}</span>
                    </p>
                    {order.vehicleModelName ? (
                      <p className="order-management__card-meta">
                        Mẫu xe: <span>{order.vehicleModelName}</span>
                      </p>
                    ) : null}
                  </div>
                  <div className="order-management__badge-group">
                    <span className={`order-management__status order-management__status--${meta.tone}`}>
                      {meta.label}
                    </span>
                    <span
                      className={`order-management__active order-management__active--${order.isactive ? 'active' : 'inactive'}`}
                    >
                      {order.isactive ? 'Đang kích hoạt' : 'Đã vô hiệu'}
                    </span>
                  </div>
                </header>

                <dl className="order-management__grid">
                  <div className="order-management__cell">
                    <dt>Mã đơn</dt>
                    <dd>{displayOrderCode}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>ID đơn hàng</dt>
                    <dd>{order.orderId}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Khách hàng</dt>
                    <dd>{order.customerId}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Phương tiện</dt>
                    <dd>{order.vehicleId}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Mẫu xe</dt>
                    <dd>{order.vehicleModelName ?? '—'}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Nhân viên phụ trách</dt>
                    <dd>{staffText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Mã khuyến mãi</dt>
                    <dd>{promotionText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Ngày đặt</dt>
                    <dd>{orderDateText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Bắt đầu</dt>
                    <dd>{startTimeText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Kết thúc</dt>
                    <dd>{endTimeText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Trả thực tế</dt>
                    <dd>{returnTimeText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Giá gốc</dt>
                    <dd>{basePriceText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Tổng tiền</dt>
                    <dd>{totalPriceText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Giá thuê / giờ</dt>
                    <dd>{pricePerHourText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Chiết khấu</dt>
                    <dd>{discountText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Giá trước ưu đãi</dt>
                    <dd>{originalPriceText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Ngày tạo</dt>
                    <dd>{createdAtText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Cập nhật lần cuối</dt>
                    <dd>{updatedAtText}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Trạng thái kích hoạt</dt>
                    <dd>{order.isactive ? 'Có' : 'Không'}</dd>
                  </div>
                </dl>

                <footer className="order-management__card-footer">
                  {['PENDING', 'CONFIRMED'].includes(statusKey) ? (
                    <button
                      type="button"
                      className="order-management__action-btn"
                      onClick={() => handleStartOrder(order.orderId)}
                      disabled={processingOrderId === order.orderId}
                    >
                      {processingOrderId === order.orderId ? 'Đang xác nhận...' : 'Xác nhận nhận xe'}
                    </button>
                  ) : (
                    <span className="order-management__action-placeholder">Không có hành động</span>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
