import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from '../../Sidebar/Sidebar';
import { User } from '../../../types';
import './StaffLayout.scss';

interface StaffLayoutProps {
  user: User;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const StaffLayout: React.FC<StaffLayoutProps> = ({ user, currentPage, onPageChange, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="staff-layout">
      {/* Sidebar */}
      <div className={`staff-layout__sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <Sidebar
          user={user}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content */}
      <div className="staff-layout__main">
        {/* Top Bar */}
        <header className="staff-layout__header">
          <div className="staff-layout__header-content">
            <button
              className="staff-layout__mobile-menu-btn"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="staff-layout__header-title">
              <h1>Quản lý trạm</h1>
              <p>Chào mừng, {user.name}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="staff-layout__content">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="staff-layout__overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default StaffLayout;
