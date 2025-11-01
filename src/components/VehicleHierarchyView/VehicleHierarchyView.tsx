import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Car } from 'lucide-react';
import { Vehicle } from '../../types';
import { mockVehicleModels, mockVehicleTypes } from '../../utils/vehicleMockData';
import './VehicleHierarchyView.scss';

interface VehicleHierarchyViewProps {
  vehicles: Vehicle[];
  onSelectVehicle?: (vehicle: Vehicle) => void;
  viewMode?: 'tree' | 'grid';
}

interface ExpandedState {
  types: Record<string, boolean>;
  models: Record<string, boolean>;
}

const VehicleHierarchyView: React.FC<VehicleHierarchyViewProps> = ({
  vehicles,
  onSelectVehicle,
  viewMode = 'tree',
}) => {
  const [expanded, setExpanded] = useState<ExpandedState>({
    types: {},
    models: {},
  });

  // Organize vehicles by type -> model -> vehicle
  const hierarchyData = useMemo(() => {
    const typeMap = new Map<string, Map<string, Vehicle[]>>();

    vehicles.forEach((vehicle) => {
      const model = mockVehicleModels.find(m => m.vehicle_model_id === vehicle.model_id);
      if (!model) return;

      if (!typeMap.has(model.type_id)) {
        typeMap.set(model.type_id, new Map());
      }

      const modelMap = typeMap.get(model.type_id)!;
      if (!modelMap.has(model.vehicle_model_id)) {
        modelMap.set(model.vehicle_model_id, []);
      }

      modelMap.get(model.vehicle_model_id)!.push(vehicle);
    });

    return Array.from(typeMap.entries()).map(([typeId, modelMap]) => ({
      type: mockVehicleTypes.find(t => t.vehicle_type_id === typeId),
      models: Array.from(modelMap.entries()).map(([modelId, vehicleList]) => ({
        model: mockVehicleModels.find(m => m.vehicle_model_id === modelId),
        vehicles: vehicleList,
      })),
    }));
  }, [vehicles]);

  const toggleTypeExpanded = (typeId: string) => {
    setExpanded(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [typeId]: !prev.types[typeId],
      },
    }));
  };

  const toggleModelExpanded = (modelId: string) => {
    setExpanded(prev => ({
      ...prev,
      models: {
        ...prev.models,
        [modelId]: !prev.models[modelId],
      },
    }));
  };

  // Tree view rendering
  const renderTreeView = () => (
    <div className="vehicle-hierarchy__tree">
      {hierarchyData.map((typeData) => (
        <div key={typeData.type?.vehicle_type_id} className="hierarchy-type">
          {/* Type Header */}
          <div
            className="hierarchy-type__header"
            onClick={() => toggleTypeExpanded(typeData.type?.vehicle_type_id || '')}
          >
            {expanded.types[typeData.type?.vehicle_type_id || ''] ? (
              <ChevronDown size={20} className="hierarchy-icon" />
            ) : (
              <ChevronRight size={20} className="hierarchy-icon" />
            )}
            <div className="hierarchy-type__info">
              <h3>{typeData.type?.type_name}</h3>
              <span className="count">{typeData.models.reduce((acc, m) => acc + m.vehicles.length, 0)} xe</span>
            </div>
          </div>

          {/* Models (shown when type is expanded) */}
          {expanded.types[typeData.type?.vehicle_type_id || ''] && (
            <div className="hierarchy-models">
              {typeData.models.map((modelData) => (
                <div key={modelData.model?.vehicle_model_id} className="hierarchy-model">
                  {/* Model Header */}
                  <div
                    className="hierarchy-model__header"
                    onClick={() => toggleModelExpanded(modelData.model?.vehicle_model_id || '')}
                  >
                    {expanded.models[modelData.model?.vehicle_model_id || ''] ? (
                      <ChevronDown size={18} className="hierarchy-icon" />
                    ) : (
                      <ChevronRight size={18} className="hierarchy-icon" />
                    )}
                    <div className="hierarchy-model__info">
                      <h4>{modelData.model?.manufacturer} {modelData.model?.name}</h4>
                      <span className="count">{modelData.vehicles.length} xe</span>
                      <span className="price">{modelData.model?.price_per_hour.toLocaleString('vi-VN')}đ/giờ</span>
                    </div>
                  </div>

                  {/* Vehicles (shown when model is expanded) */}
                  {expanded.models[modelData.model?.vehicle_model_id || ''] && (
                    <div className="hierarchy-vehicles">
                      {modelData.vehicles.map((vehicle) => (
                        <div
                          key={vehicle.vehicle_id}
                          className="hierarchy-vehicle"
                          onClick={() => onSelectVehicle?.(vehicle)}
                        >
                          <div className="vehicle-item">
                            <div className="vehicle-item__icon">
                              <Car size={16} />
                            </div>
                            <div className="vehicle-item__info">
                              <span className="serial">{vehicle.serial_number}</span>
                              <div className="vehicle-meta">
                                <span className={`status status--${vehicle.status.toLowerCase()}`}>
                                  {vehicle.status}
                                </span>
                                <span className="battery">🔋 {vehicle.battery_level}%</span>
                                <span className="range">📍 {vehicle.range}km</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  // Grid view rendering
  const renderGridView = () => (
    <div className="vehicle-hierarchy__grid">
      {hierarchyData.map((typeData) => (
        <div key={typeData.type?.vehicle_type_id} className="type-section">
          <div className="type-section__header">
            <h3>{typeData.type?.type_name}</h3>
            <span className="type-count">{typeData.models.reduce((acc, m) => acc + m.vehicles.length, 0)} xe</span>
          </div>

          <div className="type-section__models">
            {typeData.models.map((modelData) => (
              <div key={modelData.model?.vehicle_model_id} className="model-section">
                <div className="model-section__header">
                  <h4>{modelData.model?.manufacturer} {modelData.model?.name}</h4>
                  <span className="model-price">{modelData.model?.price_per_hour.toLocaleString('vi-VN')}đ/h</span>
                </div>

                <div className="model-section__vehicles">
                  {modelData.vehicles.map((vehicle) => (
                    <div
                      key={vehicle.vehicle_id}
                      className="vehicle-grid-item"
                      onClick={() => onSelectVehicle?.(vehicle)}
                    >
                      <div className="vehicle-grid-item__image">
                        {vehicle.img ? (
                          <img src={vehicle.img} alt={vehicle.serial_number} />
                        ) : (
                          <Car size={32} />
                        )}
                      </div>
                      <div className="vehicle-grid-item__content">
                        <p className="serial">{vehicle.serial_number}</p>
                        <div className="meta">
                          <span className={`status status--${vehicle.status.toLowerCase()}`}>
                            {vehicle.status}
                          </span>
                        </div>
                        <div className="details">
                          <span>🔋 {vehicle.battery_level}%</span>
                          <span>📍 {vehicle.range}km</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (hierarchyData.length === 0) {
    return (
      <div className="vehicle-hierarchy__empty">
        <Car size={48} />
        <p>Không có xe nào để hiển thị</p>
      </div>
    );
  }

  return (
    <div className="vehicle-hierarchy">
      {viewMode === 'tree' ? renderTreeView() : renderGridView()}
    </div>
  );
};

export default VehicleHierarchyView;
