import React from 'react';
import { Car, MapPin, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import './StaffDashboard.scss';

const StaffDashboard: React.FC = () => {
  const stats = [
    { title: 'Xe được phân công', value: '12', icon: <Car size={24} />, color: 'blue' },
    { title: 'Trạm quản lý', value: '3', icon: <MapPin size={24} />, color: 'green' },
    { title: 'Xe cần bảo trì', value: '2', icon: <AlertCircle size={24} />, color: 'orange' },
    { title: 'Hoàn thành hôm nay', value: '8', icon: <CheckCircle size={24} />, color: 'green' },
  ];

  const recentTasks = [
    { id: 1, task: 'Kiểm tra xe Tesla Model 3', station: 'Downtown Hub', time: '10:30 AM', status: 'completed' },
    { id: 2, task: 'Sạc xe Nissan Leaf', station: 'Airport Terminal', time: '11:15 AM', status: 'in-progress' },
    { id: 3, task: 'Bảo trì xe BMW i3', station: 'University Campus', time: '2:00 PM', status: 'pending' },
  ];

  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard__header">
        <h2>Bảng điều khiển nhân viên</h2>
        <p>Quản lý xe và trạm được phân công</p>
      </div>

      <div className="staff-dashboard__stats">
        {stats.map((stat, index) => (
          <div key={index} className={`staff-dashboard__stat staff-dashboard__stat--${stat.color}`}>
            <div className="staff-dashboard__stat-icon">
              {stat.icon}
            </div>
            <div className="staff-dashboard__stat-content">
              <h3>{stat.value}</h3>
              <p>{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="staff-dashboard__content">
        <div className="staff-dashboard__card">
          <div className="staff-dashboard__card-header">
            <h3>Nhiệm vụ gần đây</h3>
            <Clock size={20} />
          </div>
          <div className="staff-dashboard__card-content">
            <div className="staff-dashboard__task-list">
              {recentTasks.map((task) => (
                <div key={task.id} className={`staff-dashboard__task staff-dashboard__task--${task.status}`}>
                  <div className="staff-dashboard__task-info">
                    <h4>{task.task}</h4>
                    <p>{task.station} • {task.time}</p>
                  </div>
                  <div className={`staff-dashboard__task-status staff-dashboard__task-status--${task.status}`}>
                    {task.status === 'completed' && <CheckCircle size={16} />}
                    {task.status === 'in-progress' && <Clock size={16} />}
                    {task.status === 'pending' && <AlertCircle size={16} />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="staff-dashboard__card">
          <div className="staff-dashboard__card-header">
            <h3>Thông báo</h3>
            <AlertCircle size={20} />
          </div>
          <div className="staff-dashboard__card-content">
            <p>Không có thông báo mới</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
