import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Gauge,
  RefreshCcw,
  Plus,
  ListChecks,
  Loader2,
  AlertCircle,
  Compass,
  Users,
} from 'lucide-react';
import {
  stationService,
  StationRecord,
  StationVehicleRecord,
} from '../../services';
import './StationManagement.scss';

interface StationManagementProps {
  onBack?: () => void;
}

interface StationFormState {
  name: string;
  address: string;
  lat: string;
  long: string;
  capacity: string;
}

interface EditStationFormState extends StationFormState {
  imageUrl: string;
  isactive: boolean;
}

const initialFormState: StationFormState = {
  name: '',
  address: '',
  lat: '',
  long: '',
  capacity: '',
};

const initialEditFormState: EditStationFormState = {
  name: '',
  address: '',
  lat: '',
  long: '',
  capacity: '',
  imageUrl: '',
  isactive: true,
};

const StationManagement: React.FC<StationManagementProps> = ({ onBack }) => {
  const [stations, setStations] = useState<StationRecord[]>([]);
  const [stationsLoading, setStationsLoading] = useState<boolean>(true);
  const [stationsError, setStationsError] = useState<string | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  const [vehicles, setVehicles] = useState<StationVehicleRecord[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState<boolean>(false);
  const [vehiclesError, setVehiclesError] = useState<string | null>(null);

  const [formState, setFormState] = useState<StationFormState>(initialFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<EditStationFormState>(initialEditFormState);
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false);
  const [vehicleIdsInput, setVehicleIdsInput] = useState<string>('');
  const [assignError, setAssignError] = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess] = useState<string | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState<boolean>(false);

  const loadStations = useCallback(async () => {
    try {
      setStationsLoading(true);
      setStationsError(null);
      const data = await stationService.getStations();
      setStations(data);
      if (data.length > 0 && !selectedStationId) {
        setSelectedStationId(data[0].stationId);
      }
    } catch (error) {
      console.error('Failed to load stations:', error);
      setStationsError('Không thể tải danh sách trạm. Vui lòng thử lại.');
    } finally {
      setStationsLoading(false);
    }
  }, [selectedStationId]);

  const loadStationVehicles = useCallback(async (stationId: string) => {
    try {
      setVehiclesLoading(true);
      setVehiclesError(null);
      const data = await stationService.getStationVehicles(stationId);
      setVehicles(data);
    } catch (error) {
      console.error('Failed to load station vehicles:', error);
      setVehiclesError('Không thể tải danh sách xe cho trạm được chọn.');
      setVehicles([]);
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  useEffect(() => {
    if (selectedStationId) {
      loadStationVehicles(selectedStationId);
    } else {
      setVehicles([]);
    }
  }, [selectedStationId, loadStationVehicles]);

  const selectedStation = useMemo(
    () => stations.find((station) => station.stationId === selectedStationId) ?? null,
    [stations, selectedStationId]
  );

  useEffect(() => {
    if (selectedStation) {
      setEditForm({
        name: selectedStation.name ?? '',
        address: selectedStation.address ?? '',
        lat: String(selectedStation.lat),
        long: String(selectedStation.long),
        capacity: String(selectedStation.capacity),
        imageUrl: selectedStation.imageUrl ?? '',
        isactive: selectedStation.isactive,
      });
      setEditFormError(null);
      setEditSuccess(null);
    } else {
      setEditForm(initialEditFormState);
      setEditFormError(null);
      setEditSuccess(null);
    }
    setVehicleIdsInput('');
    setAssignError(null);
    setAssignSuccess(null);
  }, [selectedStation]);

  const handleSelectStation = (stationId: string) => {
    setSelectedStationId(stationId);
  };

  const handleRefreshStations = () => {
    loadStations();
  };

  const resetForm = () => {
    setFormState(initialFormState);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { name, address, lat, long, capacity } = formState;
    if (!name.trim() || !address.trim()) {
      setFormError('Vui lòng nhập đầy đủ tên và địa chỉ trạm.');
      return;
    }

    const parsedLat = Number(lat);
    const parsedLong = Number(long);
    const parsedCapacity = Number(capacity);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLong)) {
      setFormError('Vĩ độ và kinh độ phải là số hợp lệ.');
      return;
    }

    if (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0) {
      setFormError('Sức chứa phải lớn hơn 0.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        lat: parsedLat,
        long: parsedLong,
        capacity: parsedCapacity,
      };
      const createdStation = await stationService.createStation(payload);
      await loadStations();
      setSelectedStationId(createdStation.stationId);
      resetForm();
    } catch (error) {
      console.error('Failed to create station:', error);
      setFormError('Không thể tạo trạm mới. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStation = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedStationId) {
      setEditFormError('Vui lòng chọn trạm cần cập nhật.');
      return;
    }

    const { name, address, lat, long, capacity, imageUrl, isactive } = editForm;

    if (!name.trim() || !address.trim()) {
      setEditFormError('Tên và địa chỉ trạm không được để trống.');
      return;
    }

    const parsedLat = Number(lat);
    const parsedLong = Number(long);
    const parsedCapacity = Number(capacity);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLong)) {
      setEditFormError('Vĩ độ và kinh độ phải là số hợp lệ.');
      return;
    }

    if (!Number.isFinite(parsedCapacity) || parsedCapacity <= 0) {
      setEditFormError('Sức chứa phải lớn hơn 0.');
      return;
    }

    setEditSubmitting(true);
    setEditFormError(null);
    setEditSuccess(null);

    try {
      const payload = {
        name: name.trim(),
        address: address.trim(),
        lat: parsedLat,
        long: parsedLong,
        capacity: parsedCapacity,
        imageUrl: imageUrl.trim() || undefined,
        isactive,
      };

      await stationService.updateStation(selectedStationId, payload);
      await Promise.all([loadStations(), loadStationVehicles(selectedStationId)]);
      setEditSuccess('Đã cập nhật thông tin trạm.');
    } catch (error) {
      console.error('Failed to update station:', error);
      setEditFormError('Không thể cập nhật trạm. Vui lòng thử lại.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleAssignVehicles = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedStationId) {
      setAssignError('Vui lòng chọn trạm trước khi thêm xe.');
      return;
    }

    const ids = vehicleIdsInput
      .split(/[\s,]+/)
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      setAssignError('Vui lòng nhập ít nhất một vehicleId.');
      return;
    }

    setAssignSubmitting(true);
    setAssignError(null);
    setAssignSuccess(null);

    try {
      await stationService.addVehiclesToStation(selectedStationId, ids);
      await Promise.all([loadStationVehicles(selectedStationId), loadStations()]);
      setAssignSuccess(`Đã thêm ${ids.length} xe vào trạm.`);
      setVehicleIdsInput('');
    } catch (error) {
      console.error('Failed to assign vehicles to station:', error);
      setAssignError('Không thể thêm xe vào trạm. Vui lòng kiểm tra lại vehicleId.');
    } finally {
      setAssignSubmitting(false);
    }
  };

  return (
    <div className="station-management">
      <div className="station-management__header">
        <div className="station-management__title-group">
          {onBack && (
            <button type="button" className="station-management__back-btn" onClick={onBack}>
              <ArrowLeft size={16} aria-hidden />
              <span>Quay lại</span>
            </button>
          )}
          <div className="station-management__heading">
            <span className="station-management__eyebrow">Quản trị mạng lưới trạm</span>
            <h1>Quản lý trạm sạc</h1>
            <p>Theo dõi danh sách trạm, số xe đang đỗ và tạo trạm mới.</p>
          </div>
        </div>
        <button
          type="button"
          className="station-management__refresh-btn"
          onClick={handleRefreshStations}
          disabled={stationsLoading}
        >
          {stationsLoading ? <Loader2 size={16} className="spin" aria-hidden /> : <RefreshCcw size={16} aria-hidden />}
          <span>Làm mới</span>
        </button>
      </div>

      <div className="station-management__layout">
        <section className="station-management__list" aria-label="Danh sách trạm">
          {stationsLoading ? (
            <div className="station-management__placeholder">
              <Loader2 size={24} className="spin" aria-hidden />
              <p>Đang tải danh sách trạm...</p>
            </div>
          ) : stationsError ? (
            <div className="station-management__placeholder station-management__placeholder--error">
              <AlertCircle size={24} aria-hidden />
              <p>{stationsError}</p>
            </div>
          ) : stations.length === 0 ? (
            <div className="station-management__placeholder">
              <MapPin size={24} aria-hidden />
              <p>Chưa có trạm nào. Tạo trạm đầu tiên ở bảng bên phải.</p>
            </div>
          ) : (
            <ul className="station-management__items">
              {stations.map((station) => {
                const isActive = station.isactive;
                const vehicleCount = station.vehicles?.length ?? 0;
                return (
                  <li key={station.stationId}>
                    <button
                      type="button"
                      className={`station-item ${selectedStationId === station.stationId ? 'station-item--active' : ''}`}
                      onClick={() => handleSelectStation(station.stationId)}
                    >
                      <div className="station-item__header">
                        <div className="station-item__name">
                          <MapPin size={16} aria-hidden />
                          <span>{station.name}</span>
                        </div>
                        <span className={`station-item__status station-item__status--${isActive ? 'active' : 'inactive'}`}>
                          {isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </div>
                      <p className="station-item__address">{station.address}</p>
                      <div className="station-item__meta">
                        <span>
                          <Building2 size={14} aria-hidden />
                          <span>{station.capacity} chỗ</span>
                        </span>
                        <span>
                          <ListChecks size={14} aria-hidden />
                          <span>{vehicleCount} xe liên kết</span>
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="station-management__detail" aria-label="Chi tiết trạm và biểu mẫu">
          <div className="station-management__card">
            <h2>Tạo trạm mới</h2>
            <form className="station-form" onSubmit={handleSubmit}>
              <div className="station-form__group">
                <label htmlFor="station-name">Tên trạm</label>
                <input
                  id="station-name"
                  type="text"
                  value={formState.name}
                  onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Ví dụ: Downtown Hub"
                  required
                />
              </div>
              <div className="station-form__group">
                <label htmlFor="station-address">Địa chỉ</label>
                <input
                  id="station-address"
                  type="text"
                  value={formState.address}
                  onChange={(event) => setFormState((prev) => ({ ...prev, address: event.target.value }))}
                  placeholder="Số nhà, đường, thành phố"
                  required
                />
              </div>
              <div className="station-form__group station-form__group--inline">
                <div>
                  <label htmlFor="station-lat">Vĩ độ</label>
                  <input
                    id="station-lat"
                    type="number"
                    value={formState.lat}
                    onChange={(event) => setFormState((prev) => ({ ...prev, lat: event.target.value }))}
                    placeholder="10.123456"
                    step="0.000001"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="station-long">Kinh độ</label>
                  <input
                    id="station-long"
                    type="number"
                    value={formState.long}
                    onChange={(event) => setFormState((prev) => ({ ...prev, long: event.target.value }))}
                    placeholder="106.123456"
                    step="0.000001"
                    required
                  />
                </div>
              </div>
              <div className="station-form__group">
                <label htmlFor="station-capacity">Sức chứa</label>
                <input
                  id="station-capacity"
                  type="number"
                  min="1"
                  value={formState.capacity}
                  onChange={(event) => setFormState((prev) => ({ ...prev, capacity: event.target.value }))}
                  placeholder="Ví dụ: 30"
                  required
                />
              </div>
              {formError && (
                <p className="station-form__error" role="alert">{formError}</p>
              )}
              <div className="station-form__actions">
                <button type="submit" className="station-form__submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="spin" aria-hidden />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} aria-hidden />
                      <span>Tạo trạm</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="station-form__reset"
                  onClick={resetForm}
                  disabled={isSubmitting}
                >
                  Đặt lại
                </button>
              </div>
            </form>
          </div>

          <div className="station-management__card">
            <div className="station-management__card-header">
              <h2>Chi tiết trạm</h2>
              {selectedStation && (
                <span className={`station-management__status station-management__status--${selectedStation.isactive ? 'active' : 'inactive'}`}>
                  {selectedStation.isactive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                </span>
              )}
            </div>

            {selectedStation ? (
              <div className="station-details">
                <div className="station-details__grid">
                  <div>
                    <span className="station-details__label">Tên trạm</span>
                    <p className="station-details__value">{selectedStation.name}</p>
                  </div>
                  <div>
                    <span className="station-details__label">Địa chỉ</span>
                    <p className="station-details__value">{selectedStation.address}</p>
                  </div>
                  <div>
                    <span className="station-details__label">Toạ độ</span>
                    <p className="station-details__value">
                      <Compass size={14} aria-hidden />
                      <span>
                        {selectedStation.lat.toFixed(6)}, {selectedStation.long.toFixed(6)}
                      </span>
                    </p>
                  </div>
                  <div>
                    <span className="station-details__label">Sức chứa</span>
                    <p className="station-details__value">
                      <Gauge size={14} aria-hidden />
                      <span>{selectedStation.capacity} chỗ</span>
                    </p>
                  </div>
                </div>

                <div className="station-details__update">
                  <h3>Cập nhật thông tin trạm</h3>
                  <form className="station-form station-form--compact" onSubmit={handleUpdateStation}>
                    <div className="station-form__group">
                      <label htmlFor="station-edit-name">Tên trạm</label>
                      <input
                        id="station-edit-name"
                        type="text"
                        value={editForm.name}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                        placeholder="Nhập tên trạm"
                        required
                      />
                    </div>
                    <div className="station-form__group">
                      <label htmlFor="station-edit-address">Địa chỉ</label>
                      <input
                        id="station-edit-address"
                        type="text"
                        value={editForm.address}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, address: event.target.value }))}
                        placeholder="Nhập địa chỉ"
                        required
                      />
                    </div>
                    <div className="station-form__group station-form__group--inline">
                      <div>
                        <label htmlFor="station-edit-lat">Vĩ độ</label>
                        <input
                          id="station-edit-lat"
                          type="number"
                          value={editForm.lat}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, lat: event.target.value }))}
                          step="0.000001"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="station-edit-long">Kinh độ</label>
                        <input
                          id="station-edit-long"
                          type="number"
                          value={editForm.long}
                          onChange={(event) => setEditForm((prev) => ({ ...prev, long: event.target.value }))}
                          step="0.000001"
                          required
                        />
                      </div>
                    </div>
                    <div className="station-form__group">
                      <label htmlFor="station-edit-capacity">Sức chứa</label>
                      <input
                        id="station-edit-capacity"
                        type="number"
                        min="1"
                        value={editForm.capacity}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, capacity: event.target.value }))}
                        required
                      />
                    </div>
                    <div className="station-form__group">
                      <label htmlFor="station-edit-image">Ảnh (URL)</label>
                      <input
                        id="station-edit-image"
                        type="text"
                        value={editForm.imageUrl}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                        placeholder="https://example.com/station.jpg"
                      />
                    </div>
                    <div className="station-form__switch">
                      <label htmlFor="station-edit-active">Đang hoạt động</label>
                      <input
                        id="station-edit-active"
                        type="checkbox"
                        checked={editForm.isactive}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, isactive: event.target.checked }))}
                      />
                    </div>
                    {editFormError && (
                      <p className="station-form__error" role="alert">{editFormError}</p>
                    )}
                    {editSuccess && (
                      <p className="station-form__success" role="status">{editSuccess}</p>
                    )}
                    <div className="station-form__actions station-form__actions--align-start">
                      <button type="submit" className="station-form__submit" disabled={editSubmitting}>
                        {editSubmitting ? (
                          <>
                            <Loader2 size={16} className="spin" aria-hidden />
                            <span>Đang lưu...</span>
                          </>
                        ) : (
                          <>
                            <RefreshCcw size={16} aria-hidden />
                            <span>Lưu thay đổi</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="station-details__vehicles">
                  <div className="station-details__vehicles-header">
                    <h3>Xe đang thuộc trạm</h3>
                    <span className="station-details__vehicles-count">
                      {vehiclesLoading ? '...' : `${vehicles.length} xe`}
                    </span>
                  </div>

                  {vehiclesLoading ? (
                    <div className="station-management__placeholder">
                      <Loader2 size={20} className="spin" aria-hidden />
                      <p>Đang tải danh sách xe...</p>
                    </div>
                  ) : vehiclesError ? (
                    <div className="station-management__placeholder station-management__placeholder--error">
                      <AlertCircle size={20} aria-hidden />
                      <p>{vehiclesError}</p>
                    </div>
                  ) : vehicles.length === 0 ? (
                    <div className="station-management__placeholder">
                      <Users size={20} aria-hidden />
                      <p>Hiện chưa có xe nào thuộc trạm này.</p>
                    </div>
                  ) : (
                    <ul className="station-vehicle-list">
                      {vehicles.map((vehicle) => (
                        <li key={vehicle.vehicleId} className="station-vehicle-list__item">
                          <div className="station-vehicle-list__main">
                            <span className={`station-vehicle-list__status station-vehicle-list__status--${vehicle.status.toLowerCase()}`}>
                              {vehicle.status}
                            </span>
                            <span className="station-vehicle-list__serial">{vehicle.serialNumber}</span>
                          </div>
                          <div className="station-vehicle-list__meta">
                            <span>{vehicle.manufacturer || 'Đang cập nhật'} {vehicle.modelName || ''}</span>
                            {vehicle.color && <span>Màu: {vehicle.color}</span>}
                            {vehicle.pricePerHour > 0 && <span>{vehicle.pricePerHour.toLocaleString('vi-VN')}đ/giờ</span>}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}

                  <form className="station-assign" onSubmit={handleAssignVehicles}>
                    <label htmlFor="station-assign-ids">Thêm xe vào trạm</label>
                    <textarea
                      id="station-assign-ids"
                      value={vehicleIdsInput}
                      onChange={(event) => setVehicleIdsInput(event.target.value)}
                      placeholder="Nhập vehicleId, cách nhau bằng dấu phẩy hoặc dòng mới"
                      rows={3}
                    />
                    <span className="station-assign__hint">Ví dụ: f84030f4-d5af-40ed-9866-2dfc230e3048</span>
                    {assignError && (
                      <p className="station-assign__error" role="alert">{assignError}</p>
                    )}
                    {assignSuccess && (
                      <p className="station-assign__success" role="status">{assignSuccess}</p>
                    )}
                    <div className="station-assign__actions">
                      <button type="submit" disabled={assignSubmitting}>
                        {assignSubmitting ? 'Đang thêm...' : 'Thêm xe'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="station-management__placeholder">
                <MapPin size={24} aria-hidden />
                <p>Chọn một trạm ở danh sách bên trái để xem chi tiết.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default StationManagement;
