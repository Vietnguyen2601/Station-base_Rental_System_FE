import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshCw, UserCog, UserCircle, Users, AlertTriangle } from 'lucide-react';
import { accountService, AccountRecord } from '../../services';
import './AccountManagement.scss';

type AccountFilter = 'ALL' | 'STAFF' | 'CUSTOMER';

const FILTERS: Array<{ label: string; value: AccountFilter; icon: React.ReactNode }> = [
  { label: 'Tất cả', value: 'ALL', icon: <Users size={18} aria-hidden /> },
  { label: 'Nhân viên', value: 'STAFF', icon: <UserCog size={18} aria-hidden /> },
  { label: 'Khách hàng', value: 'CUSTOMER', icon: <UserCircle size={18} aria-hidden /> },
];

const normalizeRoles = (roles: string[]): string[] => roles.map((role) => role.toLowerCase());

const AccountManagement: React.FC = () => {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [filter, setFilter] = useState<AccountFilter>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountService.getAccounts();
      setAccounts(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Không thể tải danh sách tài khoản:', err);
      setError('Không thể tải danh sách tài khoản. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const filteredAccounts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const activeFilter = filter;

    return accounts.filter((account) => {
      const roles = normalizeRoles(account.roleName ?? []);
      const matchesFilter =
        activeFilter === 'ALL' ||
        (activeFilter === 'STAFF' && roles.includes('staff')) ||
        (activeFilter === 'CUSTOMER' && roles.includes('customer'));

      if (!matchesFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        account.username.toLowerCase().includes(query) ||
        account.email.toLowerCase().includes(query) ||
        (account.contactNumber ?? '').toLowerCase().includes(query)
      );
    });
  }, [accounts, filter, searchTerm]);

  const stats = useMemo(() => {
    const total = accounts.length;
    const totalStaff = accounts.filter((account) => normalizeRoles(account.roleName ?? []).includes('staff')).length;
    const totalCustomer = accounts.filter((account) => normalizeRoles(account.roleName ?? []).includes('customer')).length;

    return { total, totalStaff, totalCustomer };
  }, [accounts]);

  const handleFilterChange = (value: AccountFilter) => {
    setFilter(value);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="account-management">
      <header className="account-management__header">
        <div>
          <h2>Quản lý tài khoản</h2>
          <p>Theo dõi và quản trị tài khoản nhân viên, khách hàng trong hệ thống.</p>
        </div>
        <button
          type="button"
          className="account-management__refresh-btn"
          onClick={fetchAccounts}
          disabled={loading}
        >
          <RefreshCw size={18} aria-hidden className={loading ? 'is-spinning' : ''} />
          <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
        </button>
      </header>

      <section className="account-management__stats" aria-label="Thống kê tài khoản">
        <div className="account-management__stat-card">
          <span className="account-management__stat-label">Tổng số tài khoản</span>
          <strong className="account-management__stat-value">{stats.total}</strong>
        </div>
        <div className="account-management__stat-card account-management__stat-card--staff">
          <span className="account-management__stat-label">Nhân viên</span>
          <strong className="account-management__stat-value">{stats.totalStaff}</strong>
        </div>
        <div className="account-management__stat-card account-management__stat-card--customer">
          <span className="account-management__stat-label">Khách hàng</span>
          <strong className="account-management__stat-value">{stats.totalCustomer}</strong>
        </div>
      </section>

      <section className="account-management__toolbar" aria-label="Bộ lọc danh sách tài khoản">
        <div className="account-management__filters" role="tablist" aria-label="Bộ lọc tài khoản theo vai trò">
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              className={`account-management__filter-btn ${filter === item.value ? 'is-active' : ''}`}
              onClick={() => handleFilterChange(item.value)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="account-management__search">
          <input
            type="search"
            placeholder="Tìm theo tên, email, số điện thoại"
            value={searchTerm}
            onChange={handleSearchChange}
            aria-label="Tìm kiếm tài khoản"
          />
        </div>
      </section>

      {error && (
        <div className="account-management__error" role="alert">
          <AlertTriangle size={18} aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <section className="account-management__table" aria-live="polite">
        {loading ? (
          <div className="account-management__loading">Đang tải dữ liệu...</div>
        ) : filteredAccounts.length === 0 ? (
          <div className="account-management__empty-state">
            <Users size={32} aria-hidden />
            <h3>Không có tài khoản phù hợp</h3>
            <p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Số điện thoại</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => {
                const roles = account.roleName ?? [];
                const statusLabel = account.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động';
                const createdAt = new Date(account.createdAt);

                return (
                  <tr key={account.accountId}>
                    <td>{account.username}</td>
                    <td>{account.email}</td>
                    <td>{account.contactNumber || '—'}</td>
                    <td>
                      <div className="account-management__roles">
                        {roles.map((role) => (
                          <span key={role} className="account-management__role-chip">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className={`account-management__status account-management__status--${account.isActive ? 'active' : 'inactive'}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td>{createdAt.toLocaleDateString('vi-VN')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {lastUpdated && (
        <footer className="account-management__footer">
          Cập nhật lần cuối: {lastUpdated.toLocaleString('vi-VN')}
        </footer>
      )}
    </div>
  );
};

export default AccountManagement;
