import { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import AdminLayout from './components/layouts/AdminLayout/AdminLayout';
import StaffLayout from './components/layouts/StaffLayout/StaffLayout';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Register from './pages/Register/Register';
import Booking from './pages/Booking/Booking';
import CheckIn from './pages/CheckIn/CheckIn';
import AdminDashboard from './pages/Admin/AdminDashboard';
import StaffDashboard from './pages/Staff/StaffDashboard';
import VehicleManagement from './pages/Staff/VehicleManagement';
import VehicleDetail from './pages/VehicleDetail/VehicleDetail';
// import Return from './pages/Return/Return';
import { User } from './types';
import authService from './services/authService';
// import { mockUsers } from './utils/mockData';
import './styles/main.scss';

function App() {
  // Authentication state - In a real app, this would be managed by an auth context/service
  const [currentUser, setCurrentUser] = useState<User | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState<string>('home'); // Start with home page
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        if (authService.isAuthenticated()) {
          const user = authService.getCurrentUser();
          if (user) {
            setCurrentUser(user);
          } else {
            // Try to refresh token to get user data
            try {
              const response = await authService.refreshAccessToken();
              setCurrentUser(response.user as User);
            } catch {
              // Refresh failed, logout
              authService.logout();
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (credentials: { user: User }) => {
    const user = credentials.user;
    setCurrentUser(user);
    // Set to dashboard for staff/admin, home for customer
    if (user.role === 'staff' || user.role === 'admin') {
      setCurrentPage('dashboard');
    } else {
      setCurrentPage('home');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(undefined);
    setCurrentPage('home');
    setSelectedVehicleId(null);
  };

  const handleLogin = () => {
    setCurrentPage('login');
  };

  const handleRegister = () => {
    setCurrentPage('register');
  };

  const handleViewVehicleDetail = (vehicleId: string) => {
    console.log('handleViewVehicleDetail called with:', vehicleId);
    setSelectedVehicleId(vehicleId);
    setCurrentPage('vehicle-detail');
    console.log('Current page set to: vehicle-detail');
  };

  const handleBackFromVehicleDetail = () => {
    setSelectedVehicleId(null);
    setCurrentPage('home');
  };

  // Simple page routing - In a real app, use React Router
  const renderCurrentPage = () => {
    console.log('renderCurrentPage called with currentPage:', currentPage, 'selectedVehicleId:', selectedVehicleId);
    if (!currentUser) {
      switch (currentPage) {
        case 'login':
          return (
            <Login 
              onLoginSuccess={handleLoginSuccess}
              onRegister={handleRegister}
              onBack={() => setCurrentPage('home')}
            />
          );
        case 'register': 
          return <Register onBack={handleLogin} />;
        case 'vehicle-detail': 
          return selectedVehicleId ? (
            <VehicleDetail 
              vehicleId={selectedVehicleId}
              onBack={handleBackFromVehicleDetail}
              onRentVehicle={(vehicle) => {
                alert(`Rental process started for ${vehicle.name}`);
              }}
              userRole="customer"
            />
          ) : <Home user={undefined} onLogin={handleLogin} onRegister={handleRegister} onViewVehicleDetail={handleViewVehicleDetail} />;
        default: 
          return <Home user={undefined} onLogin={handleLogin} onRegister={handleRegister} onViewVehicleDetail={handleViewVehicleDetail} />;
      }
    }

    // Handle Staff and Admin layouts
    if (currentUser.role === 'admin') {
      return (
        <AdminLayout 
          user={currentUser} 
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onLogout={handleLogout}
        >
          {currentPage === 'dashboard' && <AdminDashboard />}
          {/* Add more admin pages here */}
        </AdminLayout>
      );
    }

    if (currentUser.role === 'staff') {
      return (
        <StaffLayout 
          user={currentUser} 
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onLogout={handleLogout}
        >
          {currentPage === 'dashboard' && <StaffDashboard />}
          {currentPage === 'vehicles' && <VehicleManagement onBack={() => setCurrentPage('dashboard')} />}
          {/* Add more staff pages here */}
        </StaffLayout>
      );
    }

    // Handle customer pages
    switch (currentPage) {
      case 'register': return <Register onBack={() => setCurrentPage('home')} />;
      case 'booking': return <Booking user={currentUser} />;
      case 'checkin': return <CheckIn user={currentUser} />;
      case 'vehicle-detail': 
        return selectedVehicleId ? (
          <VehicleDetail 
            vehicleId={selectedVehicleId}
            onBack={handleBackFromVehicleDetail}
            onRentVehicle={(vehicle) => {
              alert(`Rental process started for ${vehicle.name}`);
            }}
            userRole={currentUser.role}
          />
        ) : <Home user={currentUser} onViewVehicleDetail={handleViewVehicleDetail} />;
      // case 'return': return <Return user={currentUser} />;
      default: return <Home user={currentUser} onViewVehicleDetail={handleViewVehicleDetail} />;
    }
  };

  // Contact information for footer
  const contactInfo = {
    phone: '+1 (555) 123-4567',
    email: 'support@evrental.com',
    address: '1234 Green Energy Blvd, Sustainable City, SC 12345'
  };

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="app">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: '#0f0f23',
          color: '#ffffff'
        }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Only show header and navigation for customers */}
      {currentUser && currentUser.role === 'customer' && (
        <>
          <Header 
            user={currentUser}
            onLogin={handleLogin}
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

      {/* Render content - Staff/Admin layouts handle their own structure */}
      {currentUser && (currentUser.role === 'staff' || currentUser.role === 'admin') ? (
        renderCurrentPage()
      ) : (
        <main className="app__main">
          {renderCurrentPage()}
        </main>
      )}

      {/* Only show footer for customers */}
      {currentUser && currentUser.role === 'customer' && <Footer contactInfo={contactInfo} />}
    </div>
  );
}

export default App;