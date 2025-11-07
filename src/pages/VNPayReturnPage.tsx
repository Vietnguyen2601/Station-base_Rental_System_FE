import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Profile/Wallet.scss';
import walletService from '../services/walletService';

const SUCCESS_CODES = new Set(['00']);

type CallbackStatus = 'pending' | 'success' | 'error';

const VNPayReturnPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const entries: Record<string, string> = {};
    params.forEach((value, key) => {
      entries[key] = value;
    });
    return entries;
  }, [location.search]);

  useEffect(() => {
    const runCallback = async () => {
      if (Object.keys(queryParams).length === 0) {
        setStatus('error');
        setErrorMessage('Thiếu thông tin phản hồi từ VNPay.');
        return;
      }

      try {
        await walletService.sendVNPayCallback(queryParams);
        const responseCode = queryParams.vnp_ResponseCode ?? '';
        setStatus(SUCCESS_CODES.has(responseCode) ? 'success' : 'error');
        if (!SUCCESS_CODES.has(responseCode)) {
          setErrorMessage('Thanh toán VNPay không thành công.');
        }
      } catch (error) {
        setStatus('error');
        const message = error instanceof Error ? error.message : 'Không thể xác nhận giao dịch từ VNPay.';
        setErrorMessage(message);
      }
    };

    runCallback();
  }, [queryParams]);

  useEffect(() => {
    if (status !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/wallet', { replace: true, state: { walletUpdatedAt: Date.now() } });
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [status, navigate]);

  const transactionRef = queryParams.vnp_TxnRef;
  const responseCode = queryParams.vnp_ResponseCode;

  return (
    <div className="wallet">
      <div className="wallet__container wallet__container--narrow">
        <div className="wallet__result-card">
          {status === 'pending' && <p>Đang xác nhận giao dịch với VNPay...</p>}

          {status === 'success' && (
            <>
              <h1 className="wallet__result-title">Thanh toán thành công!</h1>
              <p className="wallet__result-message">
                Ví của bạn đã được cập nhật. Cảm ơn bạn đã hoàn tất thanh toán qua VNPay.
              </p>
              <p className="wallet__result-meta">Bạn sẽ được chuyển về trang ví sau ít giây để kiểm tra số dư.</p>
              {transactionRef && (
                <p className="wallet__result-meta">
                  Mã giao dịch: <strong>{transactionRef}</strong>
                </p>
              )}
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="wallet__result-title">Thanh toán không thành công</h1>
              <p className="wallet__result-message">
                {errorMessage ?? 'Giao dịch chưa được hoàn tất. Vui lòng thử lại hoặc liên hệ hỗ trợ.'}
              </p>
              {responseCode && (
                <p className="wallet__result-meta">
                  Mã phản hồi từ VNPay: <strong>{responseCode}</strong>
                </p>
              )}
              {transactionRef && (
                <p className="wallet__result-meta">
                  Mã giao dịch: <strong>{transactionRef}</strong>
                </p>
              )}
            </>
          )}

          <div className="wallet__result-actions">
            <button type="button" className="wallet__submit-btn" onClick={() => navigate('/wallet')}>
              Quay lại ví
            </button>
            <Link to="/wallet/top-up" className="wallet__topup-link">
              Thực hiện nạp tiền khác
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VNPayReturnPage;
