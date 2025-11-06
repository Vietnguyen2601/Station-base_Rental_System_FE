/**
 * Vehicle Service
 * Handles all vehicle-related API requests including VehicleType, VehicleModel, and Vehicle
 */

// Type definitions based on backend API response
export interface VehicleType {
  vehicleTypeId: string;
  typeName: string;
  description: string;
  createdAt: string;
  isactive: boolean;
  updatedAt: string | null;
}

export interface VehicleModel {
  vehicleModelId: string;
  typeId: string;
  name: string;
  manufacturer: string;
  pricePerHour: number;
  specs: string;
  createdAt: string;
  isactive: boolean;
  updatedAt: string | null;
}

export interface Vehicle {
  vehicleId: string;
  modelId?: string;
  serialNumber: string;
  typeName: string;
  modelName: string;
  manufacturer: string;
  pricePerHour: number;
  batteryLevel: number | null;
  batteryCapacity: number | null;
  range: number | null;
  color: string;
  img: string;
  stationName: string;
  stationId?: string | null;
  status: string;
  lastMaintenance: string;
  specs: string;
  isactive?: boolean;
  isActive?: boolean;
}

export interface HighestBatteryVehicle {
  vehicleId: string;
  serialNumber: string;
  typeName: string;
  modelName: string;
  manufacturer: string;
  pricePerHour: number;
  batteryLevel: number | null;
  batteryCapacity: number | null;
  range: number | null;
  color: string | null;
  img: string | null;
  stationName: string | null;
  status: string;
  lastMaintenance: string | null;
  specs: string | null;
}

// Component type definitions (for hierarchy view)
export interface HierarchyVehicleType {
  id: string;
  name: string;
  description: string;
  models: HierarchyVehicleModel[];
}

export interface HierarchyVehicleModel {
  id: string;
  name: string;
  manufacturer: string;
  pricePerHour: number;
  specs: string;
  vehicles: HierarchyVehicle[];
}

export interface HierarchyVehicle {
  id: string;
  serialNumber: string;
  status: string;
  batteryLevel: number | null;
  range: number | null;
  color: string;
  img: string;
  lastMaintenance: string;
}

// API Response wrapper
interface ApiResponse<T> {
  message: string;
  data: T;
}

class VehicleService {
  private baseURL = '/api/Vehicle';
  private vehicleTypeURL = '/api/VehicleType';
  private vehicleModelURL = '/api/VehicleModel';

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('accessToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get all vehicle types from backend
   */
  async getVehicleTypes(): Promise<VehicleType[]> {
    try {
      const response = await this.request<ApiResponse<VehicleType[]>>(
        this.vehicleTypeURL,
        { method: 'GET' }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      throw error;
    }
  }

  /**
   * Get vehicle type by ID with its models
   */
  async getVehicleTypeById(typeId: string): Promise<VehicleType> {
    try {
      const response = await this.request<ApiResponse<VehicleType>>(
        `${this.vehicleTypeURL}/${typeId}`,
        { method: 'GET' }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle type:', error);
      throw error;
    }
  }

  /**
   * Get all vehicle models from backend
   */
  async getVehicleModels(): Promise<VehicleModel[]> {
    try {
      const response = await this.request<ApiResponse<VehicleModel[]>>(
        this.vehicleModelURL,
        { method: 'GET' }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching vehicle models:', error);
      throw error;
    }
  }

  /**
   * Get all vehicles from backend
   */
  async getVehicles(): Promise<Vehicle[]> {
    try {
      const response = await this.request<ApiResponse<Vehicle[]>>(
        this.baseURL,
        { method: 'GET' }
      );
      return response.data || [];
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      throw error;
    }
  }

  /**
   * Get vehicle detail by ID
   */
  async getVehicleById(vehicleId: string): Promise<Vehicle> {
    try {
      const response = await this.request<ApiResponse<Vehicle>>(
        `${this.baseURL}/${vehicleId}`,
        { method: 'GET' }
      );
      if (!response.data) {
        throw new Error('Vehicle detail not found');
      }
      return response.data;
    } catch (error) {
      console.error('Error fetching vehicle by id:', error);
      throw error;
    }
  }

  async getHighestBatteryVehicle(modelId: string, stationId: string): Promise<HighestBatteryVehicle> {
    try {
      const response = await this.request<ApiResponse<HighestBatteryVehicle>>(
        `/api/Vehicle/highest-battery?vehicleModelId=${modelId}&stationId=${stationId}`,
        { method: 'GET' }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching highest battery vehicle:', error);
      throw error;
    }
  }

  /**
   * Build hierarchical structure from API data
   * Groups vehicles by model, models by type
   * Note: The API returns vehicles with all info included (typeName, modelName, etc.)
   */
  async buildHierarchyData(): Promise<HierarchyVehicleType[]> {
    try {
      // Fetch vehicles from API - they already include type and model names
      const vehicles = await this.getVehicles();

      // Create a map to group vehicles by type and model
      const hierarchyMap: { [typeKey: string]: { [modelKey: string]: HierarchyVehicleModel } } = {};

      vehicles.forEach((vehicle) => {
        const typeKey = vehicle.typeName; // Use typeName as grouping key
        const modelKey = vehicle.modelName; // Use modelName as grouping key

        // Initialize type if not exists
        if (!hierarchyMap[typeKey]) {
          hierarchyMap[typeKey] = {};
        }

        // Initialize model if not exists
        if (!hierarchyMap[typeKey][modelKey]) {
          hierarchyMap[typeKey][modelKey] = {
            id: modelKey, // Use modelName as ID for now
            name: vehicle.modelName,
            manufacturer: vehicle.manufacturer,
            pricePerHour: vehicle.pricePerHour,
            specs: vehicle.specs,
            vehicles: [],
          };
        }

        // Add vehicle to the model
        hierarchyMap[typeKey][modelKey].vehicles.push({
          id: vehicle.vehicleId,
          serialNumber: vehicle.serialNumber,
          status: vehicle.status,
          batteryLevel: vehicle.batteryLevel,
          range: vehicle.range,
          color: vehicle.color,
          img: vehicle.img,
          lastMaintenance: vehicle.lastMaintenance,
        });
      });

      // Transform into array of HierarchyVehicleType
      const hierarchy: HierarchyVehicleType[] = Object.entries(hierarchyMap).map(
        ([typeName, modelsObj]) => ({
          id: typeName,
          name: typeName,
          description: typeName,
          models: Object.values(modelsObj),
        })
      );

      return hierarchy;
    } catch (error) {
      console.error('Error building hierarchy data:', error);
      throw error;
    }
  }

  /**
   * Create a new vehicle type
   */
  async createVehicleType(data: {
    typeName: string;
    description: string;
  }): Promise<VehicleType> {
    try {
      const response = await this.request<ApiResponse<VehicleType>>(
        this.vehicleTypeURL,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle type:', error);
      throw error;
    }
  }

  /**
   * Create a new vehicle model
   */
  async createVehicleModel(data: {
    typeId: string;
    name: string;
    manufacturer: string;
    pricePerHour: number;
    specs: string;
  }): Promise<VehicleModel> {
    try {
      const response = await this.request<ApiResponse<VehicleModel>>(
        this.vehicleModelURL,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating vehicle model:', error);
      throw error;
    }
  }

  /**
   * Create a new vehicle record
   */
  async createVehicle(data: {
    modelId: string;
    stationId?: string;
    serialNumber: string;
    status: string;
    color?: string;
    batteryLevel?: number | null;
    batteryCapacity?: number | null;
    range?: number | null;
    img?: string;
  }): Promise<Vehicle> {
    try {
      const response = await this.request<ApiResponse<Vehicle>>(
        this.baseURL,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  }

  /**
   * Update an existing vehicle record
   */
  async updateVehicle(
    vehicleId: string,
    data: {
      stationId?: string | null;
      modelId?: string;
      serialNumber?: string;
      status?: string;
      color?: string | null;
      batteryLevel?: number | null;
      batteryCapacity?: number | null;
      range?: number | null;
      img?: string | null;
      lastMaintenance?: string | null;
      isactive?: boolean;
    }
  ): Promise<Vehicle> {
    try {
      const response = await this.request<ApiResponse<Vehicle>>(
        `${this.baseURL}/${vehicleId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );

      return response.data;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  /**
   * Update vehicle type
   */
  async updateVehicleType(
    typeId: string,
    data: Partial<{ typeName: string; description: string }>
  ): Promise<VehicleType> {
    try {
      const response = await this.request<ApiResponse<VehicleType>>(
        `${this.vehicleTypeURL}/${typeId}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating vehicle type:', error);
      throw error;
    }
  }

  /**
   * Delete vehicle type
   */
  async deleteVehicleType(typeId: string): Promise<void> {
    try {
      await this.request<void>(`${this.vehicleTypeURL}/${typeId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting vehicle type:', error);
      throw error;
    }
  }
}

export const vehicleService = new VehicleService();
