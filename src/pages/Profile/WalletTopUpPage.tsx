import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Wallet.scss';
import { User } from '../../types';
import walletService, { WalletRecord } from '../../services/walletService';
import { formatCurrency } from '../../utils/formatters';

interface WalletTopUpPageProps {
  user: User;
}

const MIN_TOP_UP_AMOUNT = 10_000;

const WalletTopUpPage: React.FC<WalletTopUpPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState<WalletRecord | null>(null);
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const walletData = await walletService.ensureWallet();

      if (!walletData) {
        throw new Error('Ví của bạn chưa được khởi tạo. Vui lòng liên hệ bộ phận hỗ trợ.');
      }

      setWallet(walletData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải thông tin ví.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!wallet) {
      setError('Không tìm thấy thông tin ví. Vui lòng tải lại trang.');
      return;
    }

    const numericAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ lớn hơn 0.');
      return;
    }

    if (numericAmount < MIN_TOP_UP_AMOUNT) {
      setError(`Số tiền tối thiểu cho một lần nạp là ${formatCurrency(MIN_TOP_UP_AMOUNT, 'VND', 'vi-VN')}.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await walletService.createVNPayUrl(wallet.walletId, numericAmount);
      if (!response.paymentUrl) {
        throw new Error('Không nhận được liên kết thanh toán VNPay từ máy chủ.');
      }

      console.info('[WalletTopUpPage] Redirecting to VNPay with transaction:', {
        walletId: wallet.walletId,
        transactionId: response.transactionId,
        amount: response.amount,
      });

      window.location.href = response.paymentUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể khởi tạo giao dịch VNPay.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formattedAmount = useMemo(() => {
    const numericAmount = Number(amount.replace(/[^0-9]/g, ''));
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      return formatCurrency(0, 'VND', 'vi-VN');
    }
    return formatCurrency(numericAmount, 'VND', 'vi-VN');
  }, [amount]);

  if (isLoading) {
    return (
      <div className="wallet wallet--centered">
        <div className="wallet__state">Đang tải thông tin ví...</div>
      </div>
    );
  }

  if (error && !wallet) {
    return (
      <div className="wallet wallet--centered">
        <div className="wallet__state wallet__state--error">
          <p>{error}</p>
          <button type="button" onClick={loadWallet} className="wallet__retry-btn">
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="wallet">
      <div className="wallet__container">
        <header className="wallet__header">
          <div>
            <h1 className="wallet__title">Nạp tiền vào ví</h1>
            <p className="wallet__subtitle">
              Nhập số tiền muốn nạp và hoàn tất thanh toán qua VNPay. Ví hiện tại liên kết với tài khoản {user.email}.
            </p>
          </div>
          <button
            type="button"
            className="wallet__refresh-btn"
            onClick={() => navigate('/wallet')}
            disabled={isSubmitting}
          >
            Về ví của tôi
          </button>
        </header>

        {wallet && (
          <section className="wallet__summary">
            <div className="wallet__balance-card">
              <span className="wallet__balance-label">Số dư hiện tại</span>
              <strong className="wallet__balance-value">{formatCurrency(wallet.balance ?? 0, 'VND', 'vi-VN')}</strong>
              <p className="wallet__balance-note">Mã ví: {wallet.walletId}</p>
            </div>
          </section>
        )}

        <section className="wallet__details">
          <h2 className="wallet__section-title">Thông tin giao dịch</h2>
          <form className="wallet__topup-form" onSubmit={handleSubmit}>
            <label className="wallet__form-group">
              <span className="wallet__form-label">Số tiền muốn nạp (VND)</span>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className="wallet__form-input"
                placeholder="Nhập số tiền..."
                value={amount}
                onChange={(event) => {
                  const rawValue = event.target.value.replace(/[^0-9]/g, '');
                  setAmount(rawValue);
                }}
                disabled={isSubmitting}
              />
              <span className="wallet__form-hint">Tối thiểu {formatCurrency(MIN_TOP_UP_AMOUNT, 'VND', 'vi-VN')}</span>
            </label>

            <div className="wallet__computed">
              <span className="wallet__computed-label">Số tiền sẽ thanh toán</span>
              <strong className="wallet__computed-value">{formattedAmount}</strong>
            </div>

            {error && wallet && (
              <div className="wallet__state wallet__state--error wallet__state--inline">
                <p>{error}</p>
              </div>
            )}

            <div className="wallet__form-actions">
              <button
                type="button"
                className="wallet__cancel-btn"
                onClick={() => navigate('/wallet')}
                disabled={isSubmitting}
              >
                Hủy
              </button>
              <button type="submit" className="wallet__submit-btn" disabled={isSubmitting || !amount}>
                {isSubmitting ? 'Đang tạo liên kết VNPay...' : 'Nạp tiền'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default WalletTopUpPage;
