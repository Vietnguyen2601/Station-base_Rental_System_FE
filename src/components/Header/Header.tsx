import React, { useState } from 'react';
import { Menu, X, Car, User, LogOut } from 'lucide-react';
import { HeaderProps, NavItem } from '../../types';
import './Header.scss';

const navigationItems: NavItem[] = [
  { label: 'Home', path: '/' },
  { label: 'Rent', path: '/rent' },
  { label: 'Return', path: '/return' },
  { label: 'History', path: '/history' },
  { label: 'Support', path: '/support' },
];

const Header: React.FC<HeaderProps> = ({ user, onLogin, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header__content">
          {/* Logo */}
          <div className="header__logo">
            <Car className="header__logo-icon" />
            <span className="header__logo-text">EVRental</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="header__nav">
            {navigationItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="header__nav-item"
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* User Actions */}
          <div className="header__actions">
            {user ? (
              <div className="header__user">
                <div className="header__user-info">
                  <User className="header__user-icon" />
                  <span className="header__user-name">{user.name}</span>
                  <span className="header__user-role">({user.role})</span>
                </div>
                <button
                  onClick={onLogout}
                  className="header__logout-btn"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button onClick={onLogin} className="btn btn-primary">
                Login
              </button>
            )}

            {/* Mobile Menu Button */}
            <button
              className="header__mobile-menu-btn"
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="header__mobile-nav">
            {navigationItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className="header__mobile-nav-item"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;