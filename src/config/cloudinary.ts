/**
 * Cloudinary configuration
 * Centralizes all Cloudinary related environment variables and helpers.
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
  apiKey?: string;
  folder?: string;
}

const rawConfig: CloudinaryConfig = {
  cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME ?? '',
  uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ?? '',
  apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
  folder: import.meta.env.VITE_CLOUDINARY_MEDIA_FOLDER,
};

export const getCloudinaryConfig = (): CloudinaryConfig => rawConfig;

export const validateCloudinaryConfig = (): void => {
  const missing: string[] = [];

  if (!rawConfig.cloudName) {
    missing.push('VITE_CLOUDINARY_CLOUD_NAME');
  }

  if (!rawConfig.uploadPreset) {
    missing.push('VITE_CLOUDINARY_UPLOAD_PRESET');
  }

  if (missing.length > 0) {
    throw new Error(`Thiếu cấu hình Cloudinary: ${missing.join(', ')}`);
  }
};

export const hasCloudinaryConfig = (): boolean => {
  return Boolean(rawConfig.cloudName && rawConfig.uploadPreset);
};
