import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Wallet.scss';
import { User } from '../../types';
import { walletService, WalletRecord } from '../../services/walletService';
import { formatCurrency } from '../../utils/formatters';

interface WalletOverviewProps {
  user: User;
}

const formatDateTime = (value?: string | null, options?: Intl.DateTimeFormatOptions) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString('vi-VN', {
    hour12: false,
    ...options,
  });
};

const WalletOverview: React.FC<WalletOverviewProps> = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const walletData = await walletService.ensureWallet();

      if (walletData && walletData.accountId !== user.id) {
        console.warn('Thông tin ví nhận được không khớp với người dùng hiện tại.');
      }
      setWallet(walletData ?? null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải thông tin ví.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    const state = location.state as { walletUpdatedAt?: number } | null;
    if (state?.walletUpdatedAt) {
      setNotification('Nạp tiền thành công! Số dư của bạn đã được cập nhật.');
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadWallet();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadWallet]);

  const handleTopUp = useCallback(() => {
    navigate('top-up', {
      state: wallet ? { walletId: wallet.walletId } : undefined,
    });
  }, [navigate, wallet]);

  const balanceDisplay = useMemo(
    () => formatCurrency(wallet?.balance ?? 0, 'VND', 'vi-VN'),
    [wallet?.balance]
  );

  return (
    <div className="wallet">
      <div className="wallet__container">
        <header className="wallet__header">
          <div>
            <h1 className="wallet__title">Ví của tôi</h1>
            <p className="wallet__subtitle">Theo dõi số dư và hoạt động ví điện tử của bạn.</p>
          </div>
          <div className="wallet__actions">
            <button
              type="button"
              className="wallet__topup-btn"
              onClick={handleTopUp}
              disabled={isLoading}
            >
              Nạp tiền
            </button>
            <button
              type="button"
              className="wallet__refresh-btn"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
            >
              {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
            </button>
          </div>
        </header>

        <section className="wallet__summary">
          {notification && (
            <div className="wallet__state wallet__state--inline wallet__state--success">
              <p>{notification}</p>
            </div>
          )}
          <div className="wallet__balance-card">
            <span className="wallet__balance-label">Số dư hiện tại</span>
            <strong className="wallet__balance-value">{balanceDisplay}</strong>
            <p className="wallet__balance-note">Ví được liên kết với tài khoản: {user.email}</p>
          </div>
        </section>

        {isLoading ? (
          <div className="wallet__state">Đang tải thông tin ví...</div>
        ) : error ? (
          <div className="wallet__state wallet__state--error">
            <p>{error}</p>
            <button type="button" onClick={loadWallet} className="wallet__retry-btn">
              Thử lại
            </button>
          </div>
        ) : wallet ? (
          <section className="wallet__details">
            <h2 className="wallet__section-title">Chi tiết ví</h2>
            <div className="wallet__grid">
              <div className="wallet__cell">
                <span className="wallet__cell-label">Mã ví</span>
                <span className="wallet__cell-value">{wallet.walletId}</span>
              </div>
              <div className="wallet__cell">
                <span className="wallet__cell-label">Tài khoản gắn với ví</span>
                <span className="wallet__cell-value">{wallet.accountId}</span>
              </div>
              <div className="wallet__cell">
                <span className="wallet__cell-label">Số dư</span>
                <span className="wallet__cell-value">{balanceDisplay}</span>
              </div>
              <div className="wallet__cell">
                <span className="wallet__cell-label">Ngày tạo</span>
                <span className="wallet__cell-value">{formatDateTime(wallet.createdAt, { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
              <div className="wallet__cell">
                <span className="wallet__cell-label">Cập nhật lần cuối</span>
                <span className="wallet__cell-value">{formatDateTime(wallet.updatedAt, { dateStyle: 'short', timeStyle: 'short' })}</span>
              </div>
            </div>
          </section>
        ) : (
          <div className="wallet__state wallet__state--empty">
            Không tìm thấy thông tin ví. Vui lòng thử làm mới lại trang.
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletOverview;
