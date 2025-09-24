import React, { useState } from 'react';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import Booking from './pages/Booking/Booking';
import CheckIn from './pages/CheckIn/CheckIn';
// import Return from './pages/Return/Return';
import { User } from './types';
// import { mockUsers } from './utils/mockData';
import './styles/main.scss';

function App() {
  // Authentication state - In a real app, this would be managed by an auth context/service
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<string>('login'); // Start with login page

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    setCurrentUser(undefined);
    setCurrentPage('login');
  };

  const handleRegister = () => {
    setCurrentPage('register');
  };

  // Simple page routing - In a real app, use React Router
  const renderCurrentPage = () => {
    if (!currentUser) {
      switch (currentPage) {
        case 'register': 
          return <Register />;
        default: 
          return (
            <Login 
              onLoginSuccess={handleLoginSuccess}
              onRegister={handleRegister}
            />
          );
      }
    }

    switch (currentPage) {
      case 'register': return <Register />;
      case 'booking': return <Booking user={currentUser} />;
      case 'checkin': return <CheckIn user={currentUser} />;
      // case 'return': return <Return user={currentUser} />;
      default: return <Home user={currentUser} />;
    }
  };

  // Contact information for footer
  const contactInfo = {
    phone: '+1 (555) 123-4567',
    email: 'support@evrental.com',
    address: '1234 Green Energy Blvd, Sustainable City, SC 12345'
  };

  return (
    <div className="app">
      {currentUser && (
        <>
          <Header 
            user={currentUser}
            onLogin={() => {}}
            onLogout={handleLogout}
          />
          
          {/* Simple Navigation for Demo - In real app, use React Router */}
          <nav style={{ padding: '1rem', background: '#f3f4f6', textAlign: 'center' }}>
            <button onClick={() => setCurrentPage('home')} style={{ margin: '0 0.5rem', padding: '0.5rem 1rem', background: currentPage === 'home' ? '#2563eb' : '#fff', color: currentPage === 'home' ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Trang chủ</button>
            <button onClick={() => setCurrentPage('register')} style={{ margin: '0 0.5rem', padding: '0.5rem 1rem', background: currentPage === 'register' ? '#2563eb' : '#fff', color: currentPage === 'register' ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Đăng ký</button>
            <button onClick={() => setCurrentPage('booking')} style={{ margin: '0 0.5rem', padding: '0.5rem 1rem', background: currentPage === 'booking' ? '#2563eb' : '#fff', color: currentPage === 'booking' ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Đặt xe</button>
            <button onClick={() => setCurrentPage('checkin')} style={{ margin: '0 0.5rem', padding: '0.5rem 1rem', background: currentPage === 'checkin' ? '#2563eb' : '#fff', color: currentPage === 'checkin' ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Nhận xe</button>
            <button onClick={() => setCurrentPage('return')} style={{ margin: '0 0.5rem', padding: '0.5rem 1rem', background: currentPage === 'return' ? '#2563eb' : '#fff', color: currentPage === 'return' ? '#fff' : '#000', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Trả xe</button>
          </nav>
        </>
      )}

      <main className="app__main">
        {renderCurrentPage()}
      </main>

      {currentUser && <Footer contactInfo={contactInfo} />}
    </div>
  );
}

export default App;