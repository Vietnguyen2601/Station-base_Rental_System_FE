import React, { useState } from 'react';
import { Car, Menu, X } from 'lucide-react';
import './Navbar.scss';

interface NavbarProps {
  onLogin: () => void;
  onRegister: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogin, onRegister }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleMenu = () => setIsMenuOpen((prev) => !prev);
  const handleAction = (callback: () => void) => {
    callback();
    setIsMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar__content">
          {/* Logo */}
          <div className="navbar__logo">
            <Car className="navbar__logo-icon" />
            <span className="navbar__logo-text">EVStation</span>
          </div>

          <button
            className="navbar__mobile-toggle"
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={isMenuOpen}
            onClick={handleToggleMenu}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </button>

          {/* Navigation Actions */}
          <div className={`navbar__actions ${isMenuOpen ? 'navbar__actions--open' : ''}`}>
            <button 
              onClick={() => handleAction(onLogin)}
              className="navbar__btn navbar__btn--login"
            >
              Đăng nhập
            </button>
            <button 
              onClick={() => handleAction(onRegister)}
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
