import React, { useState, useEffect } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Loader,
  Car,
  Package,
  DollarSign,
  Zap,
} from 'lucide-react';
import { vehicleService, VehicleType, VehicleModel } from '../../services';
import './VehicleTypeManagement.scss';

const VehicleTypeManagement: React.FC = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [vehicleModels, setVehicleModels] = useState<VehicleModel[]>([]);
  const [expandedTypeId, setExpandedTypeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ typeName: '', description: '' });
  const [submitting, setSubmitting] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [types, models] = await Promise.all([
        vehicleService.getVehicleTypes(),
        vehicleService.getVehicleModels(),
      ]);
      setVehicleTypes(types);
      setVehicleModels(models);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Không thể tải dữ liệu. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  // Get models for a specific type
  const getModelsForType = (typeId: string): VehicleModel[] => {
    return vehicleModels.filter((model) => model.typeId === typeId);
  };

  // Handle create new type
  const handleCreateType = async () => {
    if (!formData.typeName.trim() || !formData.description.trim()) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    try {
      setSubmitting(true);
      await vehicleService.createVehicleType({
        typeName: formData.typeName,
        description: formData.description,
      });
      setFormData({ typeName: '', description: '' });
      setShowForm(false);
      await fetchData();
    } catch (err) {
      console.error('Error creating type:', err);
      alert('Lỗi khi tạo loại xe mới');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle expand type details
  const toggleExpand = (typeId: string) => {
    setExpandedTypeId(expandedTypeId === typeId ? null : typeId);
  };

  if (loading) {
    return (
      <div className="vehicle-type-management">
        <div className="loading-state">
          <Loader size={40} className="spinner" />
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vehicle-type-management">
      {/* Header */}
      <div className="vtm-header">
        <div className="vtm-header__title">
          <h1>Quản lý Loại Xe</h1>
          <p>Tổng số loại xe: {vehicleTypes.length}</p>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={20} />
          Thêm Loại Xe Mới
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="error-alert">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="vtm-form">
          <h2>Tạo Loại Xe Mới</h2>
          <div className="form-group">
            <label>Tên Loại Xe</label>
            <input
              type="text"
              placeholder="VD: Sedan, SUV, Hatchback..."
              value={formData.typeName}
              onChange={(e) =>
                setFormData({ ...formData, typeName: e.target.value })
              }
            />
          </div>
          <div className="form-group">
            <label>Mô Tả</label>
            <textarea
              placeholder="Mô tả chi tiết về loại xe..."
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>
          <div className="form-actions">
            <button
              className="btn btn--primary"
              onClick={handleCreateType}
              disabled={submitting}
            >
              {submitting ? 'Đang tạo...' : 'Tạo Loại Xe'}
            </button>
            <button
              className="btn btn--secondary"
              onClick={() => setShowForm(false)}
            >
              Hủy
            </button>
          </div>
        </div>
      )}

      {/* Vehicle Types List */}
      <div className="vtm-list">
        {vehicleTypes.length === 0 ? (
          <div className="empty-state">
            <Car size={48} />
            <h3>Không có loại xe nào</h3>
            <p>Hãy tạo loại xe mới để bắt đầu</p>
          </div>
        ) : (
          vehicleTypes.map((type) => {
            const models = getModelsForType(type.vehicleTypeId);
            const isExpanded = expandedTypeId === type.vehicleTypeId;

            return (
              <div key={type.vehicleTypeId} className="vtm-item">
                {/* Type Header */}
                <div
                  className="vtm-item__header"
                  onClick={() => toggleExpand(type.vehicleTypeId)}
                >
                  <div className="vtm-item__info">
                    <div className="vtm-item__icon">
                      <Car size={24} />
                    </div>
                    <div className="vtm-item__content">
                      <h3>{type.typeName}</h3>
                      <p>{type.description}</p>
                      <span className="model-count">
                        {models.length} mẫu xe
                      </span>
                    </div>
                  </div>
                  <div className="vtm-item__actions">
                    <button className="btn-icon btn-icon--edit">
                      <Edit size={18} />
                    </button>
                    <button className="btn-icon btn-icon--delete">
                      <Trash2 size={18} />
                    </button>
                    <button
                      className="btn-icon btn-icon--expand"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpand(type.vehicleTypeId);
                      }}
                    >
                      {isExpanded ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Models List (Expanded) */}
                {isExpanded && (
                  <div className="vtm-item__models">
                    {models.length === 0 ? (
                      <div className="no-models">
                        <p>Chưa có mẫu xe nào cho loại xe này</p>
                      </div>
                    ) : (
                      <div className="models-grid">
                        {models.map((model) => (
                          <div key={model.vehicleModelId} className="model-card">
                            <div className="model-card__header">
                              <h4>{model.name}</h4>
                              <span className="manufacturer">
                                {model.manufacturer}
                              </span>
                            </div>
                            <div className="model-card__details">
                              <div className="detail">
                                <Package size={16} />
                                <span>{model.specs}</span>
                              </div>
                              <div className="detail">
                                <DollarSign size={16} />
                                <span>
                                  {model.pricePerHour.toLocaleString('vi-VN')}
                                  đ/giờ
                                </span>
                              </div>
                              <div className="detail">
                                <Zap size={16} />
                                <span
                                  className={
                                    model.isactive ? 'status--active' : ''
                                  }
                                >
                                  {model.isactive ? 'Hoạt động' : 'Không hoạt động'}
                                </span>
                              </div>
                            </div>
                            <div className="model-card__actions">
                              <button className="btn-small btn-small--edit">
                                <Edit size={14} />
                              </button>
                              <button className="btn-small btn-small--delete">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default VehicleTypeManagement;
