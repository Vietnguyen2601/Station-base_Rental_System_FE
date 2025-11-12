import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Profile/Wallet.scss';
import walletService from '../services/walletService';
import {
  PendingWalletVNPayTransaction,
  WALLET_VNPAY_SUCCESS_CODES,
} from '../constants/wallet';
import { formatCurrency } from '../utils/formatters';

type CallbackStatus = 'pending' | 'success' | 'error';

const VNPayReturnPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<CallbackStatus>('pending');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingTransaction, setPendingTransaction] = useState<PendingWalletVNPayTransaction | null>(null);
  const [successDetails, setSuccessDetails] = useState<{
    amount?: number;
    transactionId?: string;
    walletBalance?: number;
  } | null>(null);

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
        walletService.clearPendingVNPayTransaction();
        return;
      }

      try {
        const storedTransaction = walletService.getPendingVNPayTransaction();
        setPendingTransaction(storedTransaction);

        const callbackResponse = await walletService.sendVNPayCallback(queryParams);
        const responseCode = queryParams.vnp_ResponseCode ?? callbackResponse.data?.responseCode ?? '';

        const gatewaySuccess = responseCode ? WALLET_VNPAY_SUCCESS_CODES.has(responseCode) : false;
        const serverStatus = callbackResponse.data?.status ?? callbackResponse.data?.transactionStatus ?? callbackResponse.data?.paymentStatus;
        const serverSuccessByStatus = typeof serverStatus === 'string' && serverStatus.toLowerCase() === 'success';
        const serverSuccessFlag = callbackResponse.data?.isSuccess ?? serverSuccessByStatus;
        const httpStatusSuccess = callbackResponse.statusCode >= 200 && callbackResponse.statusCode < 300;

        const isSuccess = gatewaySuccess && (serverSuccessFlag ?? httpStatusSuccess);

        if (isSuccess) {
          setStatus('success');
          setSuccessDetails({
            amount: callbackResponse.data?.amount ?? storedTransaction?.amount,
            transactionId: callbackResponse.data?.transactionId ?? storedTransaction?.transactionId ?? queryParams.vnp_TxnRef,
            walletBalance: callbackResponse.data?.walletBalance,
          });
          walletService.clearPendingVNPayTransaction();
        } else {
          setStatus('error');
          const fallbackMessage = callbackResponse.data?.message ?? callbackResponse.message ?? 'Thanh toán VNPay không thành công.';
          setErrorMessage(fallbackMessage);
          walletService.clearPendingVNPayTransaction();
        }
      } catch (error) {
        setStatus('error');
        const message = error instanceof Error ? error.message : 'Không thể xác nhận giao dịch từ VNPay.';
        setErrorMessage(message);
        walletService.clearPendingVNPayTransaction();
      }
    };

    runCallback();
  }, [queryParams]);

  useEffect(() => {
    if (status !== 'success') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/wallet', {
        replace: true,
        state: {
          walletUpdatedAt: Date.now(),
          walletTopUpAmount: successDetails?.amount,
          walletTopUpTransactionId: successDetails?.transactionId,
        },
      });
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [status, successDetails, navigate]);

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
              {successDetails?.transactionId && successDetails.transactionId !== transactionRef && (
                <p className="wallet__result-meta">
                  Mã tham chiếu nội bộ: <strong>{successDetails.transactionId}</strong>
                </p>
              )}
              {successDetails?.amount && (
                <p className="wallet__result-meta">
                  Số tiền nạp: <strong>{formatCurrency(successDetails.amount, 'VND', 'vi-VN')}</strong>
                </p>
              )}
              {typeof successDetails?.walletBalance === 'number' && (
                <p className="wallet__result-meta">
                  Số dư mới: <strong>{formatCurrency(successDetails.walletBalance, 'VND', 'vi-VN')}</strong>
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
              {pendingTransaction?.amount && (
                <p className="wallet__result-meta">
                  Số tiền dự kiến: <strong>{formatCurrency(pendingTransaction.amount, 'VND', 'vi-VN')}</strong>
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
