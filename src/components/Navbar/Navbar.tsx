import React from 'react';
import { Car } from 'lucide-react';
import './Navbar.scss';

interface NavbarProps {
  onLogin: () => void;
  onRegister: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogin, onRegister }) => {
  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar__content">
          {/* Logo */}
          <div className="navbar__logo">
            <Car className="navbar__logo-icon" />
            <span className="navbar__logo-text">EVStation</span>
          </div>

          {/* Navigation Actions */}
          <div className="navbar__actions">
            <button 
              onClick={onLogin}
              className="navbar__btn navbar__btn--login"
            >
              Đăng nhập
            </button>
            <button 
              onClick={onRegister}
              className="navbar__btn navbar__btn--register"
            >
              Đăng ký
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
