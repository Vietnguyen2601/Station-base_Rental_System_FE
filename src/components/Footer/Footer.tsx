import React from 'react';
import { Phone, Mail, MapPin, Car } from 'lucide-react';
import { FooterProps } from '../../types';
import './Footer.scss';

const Footer: React.FC<FooterProps> = ({ contactInfo }) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          {/* Company Info */}
          <div className="footer__section">
            <div className="footer__logo">
              <Car className="footer__logo-icon" />
              <span className="footer__logo-text">EVRental</span>
            </div>
            <p className="footer__description">
              Leading EV rental platform connecting you to sustainable transportation
              at convenient station locations across the city.
            </p>
          </div>

          {/* Quick Links */}
          <div className="footer__section">
            <h3 className="footer__title">Quick Links</h3>
            <ul className="footer__links">
              <li><a href="/" className="footer__link">Home</a></li>
              <li><a href="/rent" className="footer__link">Rent Vehicle</a></li>
              <li><a href="/return" className="footer__link">Return Vehicle</a></li>
              <li><a href="/history" className="footer__link">Rental History</a></li>
              <li><a href="/support" className="footer__link">Support</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer__section">
            <h3 className="footer__title">Services</h3>
            <ul className="footer__links">
              <li><a href="/stations" className="footer__link">Find Stations</a></li>
              <li><a href="/vehicles" className="footer__link">Vehicle Types</a></li>
              <li><a href="/pricing" className="footer__link">Pricing</a></li>
              <li><a href="/membership" className="footer__link">Membership</a></li>
              <li><a href="/corporate" className="footer__link">Corporate</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer__section">
            <h3 className="footer__title">Contact Us</h3>
            <div className="footer__contact">
              <div className="footer__contact-item">
                <Phone className="footer__contact-icon" />
                <a href={`tel:${contactInfo.phone}`} className="footer__contact-text">
                  {contactInfo.phone}
                </a>
              </div>
              <div className="footer__contact-item">
                <Mail className="footer__contact-icon" />
                <a href={`mailto:${contactInfo.email}`} className="footer__contact-text">
                  {contactInfo.email}
                </a>
              </div>
              <div className="footer__contact-item">
                <MapPin className="footer__contact-icon" />
                <span className="footer__contact-text">{contactInfo.address}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="footer__bottom">
          <div className="footer__legal">
            <a href="/privacy" className="footer__legal-link">Privacy Policy</a>
            <a href="/terms" className="footer__legal-link">Terms of Service</a>
            <a href="/cookies" className="footer__legal-link">Cookie Policy</a>
          </div>
          <div className="footer__copyright">
            <p>&copy; {currentYear} EVRental. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;