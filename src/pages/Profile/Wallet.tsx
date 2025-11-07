import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './Wallet.scss';
import { User } from '../../types';
import WalletOverview from './WalletOverview';
import WalletTopUpPage from './WalletTopUpPage';
import VNPayReturnPage from './VNPayReturnPage';

interface WalletProps {
  user: User;
}

const Wallet: React.FC<WalletProps> = ({ user }) => {
  return (
    <Routes>
      <Route path="/wallet" element={<WalletOverview user={user} />} />
      <Route path="/wallet/top-up" element={<WalletTopUpPage user={user} />} />
      <Route path="/payment/return" element={<VNPayReturnPage />} />
      <Route path="*" element={<Navigate to="/wallet" replace />} />
    </Routes>
  );
};

export default Wallet;
