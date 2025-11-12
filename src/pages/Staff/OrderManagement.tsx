import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCcw, Filter, Search } from 'lucide-react';
import './OrderManagement.scss';
import { orderService, OrderRecord } from '../../services/orderService';
import { accountService, AccountRecord } from '../../services/accountService';
import { vehicleService, Vehicle } from '../../services/vehicleService';

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

const getOrderTimestamp = (order: OrderRecord): number => {
  const candidates = [order.createdAt, order.orderDate, order.updatedAt, order.startTime, order.endTime];

  for (const value of candidates) {
    if (!value) continue;
    const time = new Date(value).getTime();
    if (!Number.isNaN(time)) {
      return time;
    }
  }

  return 0;
};

interface OrderManagementProps {
  onViewOrderDetails?: (order: OrderRecord) => void;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ onViewOrderDetails }) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [accountLookup, setAccountLookup] = useState<Record<string, string>>({});
  const [vehicleModelLookup, setVehicleModelLookup] = useState<Record<string, string>>({});
  const [orderCodeSearch, setOrderCodeSearch] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const sortOrders = useCallback((data: OrderRecord[]) => {
    return [...data].sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
  }, []);

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await orderService.getAllOrders();
      setOrders(sortOrders(response.data ?? []));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách đơn đặt xe.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [sortOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const loadReferenceData = useCallback(async () => {
    try {
      const [accounts, vehicles] = await Promise.all([
        accountService
          .getAccounts()
          .catch((err) => {
            console.error('Không thể tải danh sách tài khoản:', err);
            return [] as AccountRecord[];
          }),
        vehicleService
          .getVehicles()
          .catch((err) => {
            console.error('Không thể tải danh sách phương tiện:', err);
            return [] as Vehicle[];
          }),
      ]);

      if (accounts.length) {
        const accountMap = accounts.reduce<Record<string, string>>((map, account) => {
          map[account.accountId] = account.username || account.email || account.accountId;
          return map;
        }, {});
        setAccountLookup(accountMap);
      }

      if (vehicles.length) {
        const vehicleMap = vehicles.reduce<Record<string, string>>((map, vehicle) => {
          map[vehicle.vehicleId] = vehicle.modelName || vehicle.vehicleId;
          return map;
        }, {});
        setVehicleModelLookup(vehicleMap);
      }
    } catch (err) {
      console.error('Không thể tải dữ liệu tham chiếu cho đơn hàng:', err);
    }
  }, []);

  useEffect(() => {
    loadReferenceData();
  }, [loadReferenceData]);

  const handleStartOrder = useCallback(
    async (orderId: string) => {
      setProcessingOrderId(orderId);
      setActionMessage(null);

      try {
        const response = await orderService.startOrder(orderId);
        const updatedOrder = response.data;

        if (updatedOrder) {
          setOrders((prev) =>
            sortOrders(prev.map((order) => (order.orderId === updatedOrder.orderId ? { ...order, ...updatedOrder } : order)))
          );
        } else {
          await loadOrders();
        }

        setActionMessage({ type: 'success', text: response.message ?? 'Đơn hàng đã được kích hoạt.' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể kích hoạt đơn hàng. Vui lòng thử lại.';
        setActionMessage({ type: 'error', text: message });
      } finally {
        setProcessingOrderId(null);
      }
    },
    [loadOrders, sortOrders]
  );

  const handleVerifyOrderCode = useCallback(async () => {
    const trimmedCode = orderCodeSearch.trim();
    if (!trimmedCode) {
      setActionMessage({ type: 'error', text: 'Vui lòng nhập mã đơn hàng.' });
      return;
    }

    setActionMessage(null);
    setIsVerifyingCode(true);

    try {
      const response = await orderService.verifyOrderCode(trimmedCode);
      const data = response.data;

      await loadOrders();

      setStatusFilter('all');
      setSearchTerm(data?.orderCode ?? trimmedCode);
      setOrderCodeSearch('');

      setActionMessage({ type: 'success', text: response.message ?? 'Đã tìm thấy đơn hàng.' });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không tìm thấy đơn hàng với mã này.';
      setActionMessage({ type: 'error', text: message });
    } finally {
      setIsVerifyingCode(false);
    }
  }, [loadOrders, orderCodeSearch]);

  const handleCompleteOrder = useCallback(
    async (orderId: string) => {
      setProcessingOrderId(orderId);
      setActionMessage(null);

      try {
        const response = await orderService.updateReturnTime(orderId);
        const updatedOrder = response.data;

        if (updatedOrder) {
          setOrders((prev) =>
            sortOrders(
              prev.map((order) =>
                order.orderId === updatedOrder.orderId
                  ? {
                      ...order,
                      status: updatedOrder.orderStatus ?? order.status,
                      returnTime: updatedOrder.returnTime ?? order.returnTime,
                      isactive: false,
                    }
                  : order
              )
            )
          );
        } else {
          await loadOrders();
        }

        setActionMessage({ type: 'success', text: response.message ?? 'Đơn hàng đã được hoàn tất.' });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể cập nhật thời gian trả xe. Vui lòng thử lại.';
        setActionMessage({ type: 'error', text: message });
      } finally {
        setProcessingOrderId(null);
      }
    },
    [loadOrders, sortOrders]
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

      const customerName = accountLookup[order.customerId] ?? order.customerId;
      const vehicleModelName = vehicleModelLookup[order.vehicleId] ?? order.vehicleModelName ?? order.vehicleId;

      const haystack = [
        order.orderId,
        order.orderCode ?? '',
        order.customerId,
        customerName,
        order.vehicleId,
        vehicleModelName,
        order.promotionId ?? '',
        order.status,
      ]
        .filter(Boolean)
        .map((value) => value!.toString().toLowerCase());

      return haystack.some((value) => value.includes(normalizedSearch));
    });
  }, [accountLookup, orders, searchTerm, statusFilter, vehicleModelLookup]);

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
        <div className="order-management__code-search">
          <input
            type="text"
            placeholder="Nhập mã đơn (ví dụ: K6C5Q3)"
            value={orderCodeSearch}
            onChange={(event) => setOrderCodeSearch(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleVerifyOrderCode();
              }
            }}
          />
          <button
            type="button"
            className="order-management__code-search-btn"
            onClick={handleVerifyOrderCode}
            disabled={isVerifyingCode}
          >
            {isVerifyingCode ? 'Đang kiểm tra...' : 'Tìm mã'}
          </button>
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
            const basePriceText = formatCurrencyVND(order.basePrice);
            const totalPriceText = formatCurrencyVND(order.totalPrice);
            const orderDateText = formatDateTime(order.orderDate, { dateStyle: 'short', timeStyle: 'short' });
            const startTimeText = formatDateTime(order.startTime, { dateStyle: 'short', timeStyle: 'short' });
            const endTimeText = formatDateTime(order.endTime, { dateStyle: 'short', timeStyle: 'short' });
            const returnTimeText = formatDateTime(order.returnTime, { dateStyle: 'short', timeStyle: 'short' });
            const customerName = accountLookup[order.customerId] ?? order.customerId;
            const vehicleModelName = vehicleModelLookup[order.vehicleId] ?? order.vehicleModelName ?? order.vehicleId;
            const canActivate = statusKey === 'CONFIRMED';
            const canComplete = statusKey === 'ONGOING';
            const hasDetailAction = Boolean(onViewOrderDetails);
            const hasActions = canActivate || canComplete || hasDetailAction;

            return (
              <article key={order.orderId} className="order-management__card">
                <header className="order-management__card-header">
                  <div className="order-management__identity">
                    <h3 className="order-management__card-code">{displayOrderCode}</h3>
                    {vehicleModelName ? (
                      <p className="order-management__card-meta">
                        Mẫu xe: <span>{vehicleModelName}</span>
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
                    <dd>{customerName}</dd>
                  </div>
                  <div className="order-management__cell">
                    <dt>Phương tiện</dt>
                    <dd>{vehicleModelName}</dd>
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
                </dl>

                <footer className="order-management__card-footer">
                  {canActivate && (
                    <button
                      type="button"
                      className="order-management__action-btn"
                      onClick={() => handleStartOrder(order.orderId)}
                      disabled={processingOrderId === order.orderId}
                    >
                      {processingOrderId === order.orderId ? 'Đang kích hoạt...' : 'Kích hoạt đơn'}
                    </button>
                  )}
                  {canComplete && (
                    <button
                      type="button"
                      className="order-management__action-btn order-management__action-btn--complete"
                      onClick={() => handleCompleteOrder(order.orderId)}
                      disabled={processingOrderId === order.orderId}
                    >
                      {processingOrderId === order.orderId ? 'Đang hoàn tất...' : 'Hoàn tất đơn'}
                    </button>
                  )}
                  {hasDetailAction && (
                    <button
                      type="button"
                      className="order-management__secondary-btn"
                      onClick={() => onViewOrderDetails?.(order)}
                      disabled={processingOrderId === order.orderId}
                    >
                      Xem chi tiết
                    </button>
                  )}
                  {!hasActions && <span className="order-management__action-placeholder">Không có hành động</span>}
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
