export const WALLET_VNPAY_PENDING_TRANSACTION_KEY = 'wallet:vnpay:pending-transaction';

export const WALLET_VNPAY_SUCCESS_CODES = new Set(['00']);

export interface PendingWalletVNPayTransaction {
  walletId: string;
  amount: number;
  transactionId?: string;
  createdAt: number;
}

export const buildVNPayReturnUrl = (): string => {
  if (typeof window === 'undefined') {
    return '/payment/return';
  }

  const returnUrl = new URL('/payment/return', window.location.origin);
  return returnUrl.toString();
};
