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
            <option value="COMPLETED">Hoàn tất</option>
            <option value="CANCELLED">Đã hủy</option>
            <option value="REJECTED">Từ chối</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="order-management__state">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="order-management__state order-management__state--error">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="order-management__state order-management__state--empty">Không tìm thấy đơn đặt xe phù hợp.</div>
      ) : (
        <div className="order-management__table-wrapper">
          <table className="order-management__table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Khách hàng</th>
                <th>Phương tiện</th>
                <th>Bắt đầu</th>
                <th>Kết thúc</th>
                <th>Giá gốc</th>
                <th>Tổng tiền</th>
                <th>Mã khuyến mãi</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const statusKey = order.status?.toUpperCase() ?? 'UNKNOWN';
                const meta = statusMeta[statusKey] ?? { label: statusKey, tone: 'neutral' as const };

                return (
                  <tr key={order.orderId}>
                    <td data-label="Mã đơn">{order.orderId}</td>
                    <td data-label="Khách hàng">{order.customerId}</td>
                    <td data-label="Phương tiện">{order.vehicleId}</td>
                    <td data-label="Bắt đầu">{formatDateTime(order.startTime, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td data-label="Kết thúc">{formatDateTime(order.endTime, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td data-label="Giá gốc">{formatCurrencyVND(order.basePrice)}</td>
                    <td data-label="Tổng tiền">{formatCurrencyVND(order.totalPrice)}</td>
                    <td data-label="Khuyến mãi">{order.promotionId ?? '---'}</td>
                    <td data-label="Ngày tạo">{formatDateTime(order.createdAt, { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td data-label="Trạng thái">
                      <span className={`order-management__status order-management__status--${meta.tone}`}>
                        {meta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
