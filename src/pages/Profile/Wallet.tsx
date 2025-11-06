import React, { useCallback, useEffect, useState } from 'react';
import './Wallet.scss';
import { User } from '../../types';
import { walletService, WalletRecord } from '../../services/walletService';
import { formatCurrency } from '../../utils/formatters';

interface WalletProps {
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

const Wallet: React.FC<WalletProps> = ({ user }) => {
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await walletService.ensureWallet();
      const response = await walletService.getWalletBalance();
      const walletData = response.data ?? null;
      if (walletData && walletData.accountId !== user.id) {
        console.warn('Thông tin ví nhận được không khớp với người dùng hiện tại.');
      }
      setWallet(walletData);
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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadWallet();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadWallet]);

  const balanceDisplay = wallet ? formatCurrency(wallet.balance ?? 0, 'VND', 'vi-VN') : formatCurrency(0, 'VND', 'vi-VN');

  return (
    <div className="wallet">
      <div className="wallet__container">
        <header className="wallet__header">
          <div>
            <h1 className="wallet__title">Ví của tôi</h1>
            <p className="wallet__subtitle">Theo dõi số dư và hoạt động ví điện tử của bạn.</p>
          </div>
          <button
            type="button"
            className="wallet__refresh-btn"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
          >
            {isRefreshing ? 'Đang làm mới...' : 'Làm mới'}
          </button>
        </header>

        <section className="wallet__summary">
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

export default Wallet;
