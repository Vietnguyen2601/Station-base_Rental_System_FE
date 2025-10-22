import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from '../../Sidebar/Sidebar';
import { User } from '../../../types';
import './AdminLayout.scss';

interface AdminLayoutProps {
  user: User;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ user, currentPage, onPageChange, onLogout, children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handlePageChange = (page: string) => {
    onPageChange(page);
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <div className={`admin-layout__sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <Sidebar
          user={user}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onLogout={onLogout}
        />
      </div>

      {/* Main Content */}
      <div className="admin-layout__main">
        {/* Top Bar */}
        <header className="admin-layout__header">
          <div className="admin-layout__header-content">
            <button
              className="admin-layout__mobile-menu-btn"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="admin-layout__header-title">
              <h1>Quản trị hệ thống</h1>
              <p>Chào mừng, {user.name}</p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="admin-layout__content">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="admin-layout__overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminLayout;
