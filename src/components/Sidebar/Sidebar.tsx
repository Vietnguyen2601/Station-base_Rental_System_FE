import React from 'react';
import { 
  LayoutDashboard, 
  Car, 
  MapPin, 
  BarChart3, 
  FileText, 
  LogOut,
  User,
  Package,
  Users,
  Tag
} from 'lucide-react';
import { User as UserType } from '../../types';
import './Sidebar.scss';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

interface SidebarProps {
  user: UserType;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, currentPage, onPageChange, onLogout }) => {
  // Define sidebar items based on user role
  const getSidebarItems = (): SidebarItem[] => {
    if (user.role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: 'dashboard' },
        { id: 'accounts', label: 'Quản lý tài khoản', icon: <Users size={20} />, path: 'accounts' },
        { id: 'reports', label: 'Report', icon: <BarChart3 size={20} />, path: 'reports' },
      ];
    } else if (user.role === 'staff') {
      return [
        { id: 'dashboard', label: 'Tổng quan', icon: <LayoutDashboard size={20} />, path: 'dashboard' },
        { id: 'vehicles', label: 'Quản lý xe', icon: <Car size={20} />, path: 'vehicles' },
        { id: 'model-selection', label: 'Chọn loại xe', icon: <Package size={20} />, path: 'model-selection' },
        { id: 'vehicle-types', label: 'Loại xe', icon: <Package size={20} />, path: 'vehicle-types' },
    { id: 'stations', label: 'Quản lý trạm', icon: <MapPin size={20} />, path: 'stations' },
    { id: 'bookings', label: 'Quản lý đơn', icon: <FileText size={20} />, path: 'bookings' },
    { id: 'promotions', label: 'Mã giảm giá', icon: <Tag size={20} />, path: 'promotions' },
        { id: 'reports', label: 'Báo cáo', icon: <BarChart3 size={20} />, path: 'reports' },
      ];
    }
    return [];
  };

  const sidebarItems = getSidebarItems();

  return (
    <aside className="sidebar">
      <div className="sidebar__content">
        {/* Logo */}
        <div className="sidebar__logo">
          <Car size={24} />
          <span>EVStation</span>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar__nav">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.path)}
              className={`sidebar__nav-item ${currentPage === item.path ? 'active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="sidebar__footer">
          <div className="sidebar__user">
            <div className="sidebar__user-avatar">
              <User size={20} />
            </div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{user.username}</div>
              <div className="sidebar__user-role">{user.role}</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="sidebar__logout-btn"
            title="Đăng xuất"
          >
            <LogOut size={20} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
