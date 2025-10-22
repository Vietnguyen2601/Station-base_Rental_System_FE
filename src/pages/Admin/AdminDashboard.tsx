import React from 'react';
import { BarChart3, Users, Car, MapPin, TrendingUp, Activity } from 'lucide-react';
import './AdminDashboard.scss';

const AdminDashboard: React.FC = () => {
  const stats = [
    { title: 'Tổng người dùng', value: '1,234', icon: <Users size={24} />, color: 'blue' },
    { title: 'Xe đang hoạt động', value: '89', icon: <Car size={24} />, color: 'green' },
    { title: 'Trạm sạc', value: '24', icon: <MapPin size={24} />, color: 'purple' },
    { title: 'Đặt xe hôm nay', value: '156', icon: <TrendingUp size={24} />, color: 'orange' },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h2>Tổng quan hệ thống</h2>
        <p>Thống kê tổng quan về hoạt động của hệ thống EVStation</p>
      </div>

      <div className="admin-dashboard__stats">
        {stats.map((stat, index) => (
          <div key={index} className={`admin-dashboard__stat admin-dashboard__stat--${stat.color}`}>
            <div className="admin-dashboard__stat-icon">
              {stat.icon}
            </div>
            <div className="admin-dashboard__stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard__content">
        <div className="admin-dashboard__card">
          <div className="admin-dashboard__card-header">
            <h3>Hoạt động gần đây</h3>
            <Activity size={20} />
          </div>
          <div className="admin-dashboard__card-content">
            <p>Nội dung hoạt động gần đây sẽ được hiển thị ở đây...</p>
          </div>
        </div>

        <div className="admin-dashboard__card">
          <div className="admin-dashboard__card-header">
            <h3>Biểu đồ thống kê</h3>
            <BarChart3 size={20} />
          </div>
          <div className="admin-dashboard__card-content">
            <p>Biểu đồ thống kê sẽ được hiển thị ở đây...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
