import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { CloudinaryImage as CloudinaryImageAsset } from '@cloudinary/url-gen/assets/CloudinaryImage';
import {
  getCloudinaryConfig,
  validateCloudinaryConfig,
} from '../config/cloudinary';

const { cloudName, uploadPreset, folder } = getCloudinaryConfig();

let cloudinaryInstance: Cloudinary | null = null;

const getCloudinary = (): Cloudinary => {
  if (!cloudName) {
    throw new Error('Chưa cấu hình Cloudinary cloud name. Vui lòng thiết lập biến VITE_CLOUDINARY_CLOUD_NAME.');
  }

  if (!cloudinaryInstance) {
    cloudinaryInstance = new Cloudinary({ cloud: { cloudName } });
  }

  return cloudinaryInstance;
};

export interface BuildVehicleImageOptions {
  width?: number;
  height?: number;
  cropToSquare?: boolean;
}

export const buildVehicleImage = (
  publicId: string,
  { width = 500, height = 500, cropToSquare = true }: BuildVehicleImageOptions = {}
): CloudinaryImageAsset => {
  const cld = getCloudinary();
  const image = cld.image(publicId).format('auto').quality('auto');

  if (cropToSquare) {
    image.resize(auto().gravity(autoGravity()).width(width).height(height));
  } else if (width || height) {
    image.resize(auto().gravity(autoGravity()).width(width).height(height));
  }

  return image;
};

export const isCloudinaryPublicId = (value?: string | null): boolean => {
  if (!value) {
    return false;
  }

  return !/^https?:\/\//i.test(value);
};

export interface UploadVehicleImageResult {
  publicId: string;
  secureUrl: string;
}

export const uploadVehicleImage = async (file: File): Promise<UploadVehicleImageResult> => {
  if (!file) {
    throw new Error('Không có tệp nào được chọn để tải lên.');
  }

  validateCloudinaryConfig();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  if (folder) {
    formData.append('folder', folder);
  }

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = `Upload thất bại với mã trạng thái ${response.status}.`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error?.message) {
        message = `Upload thất bại: ${errorBody.error.message}`;
      }
    } catch (error) {
      console.warn('Không thể đọc phản hồi lỗi Cloudinary:', error);
    }
    throw new Error(message);
  }

  const data = await response.json();
  return {
    publicId: data.public_id,
    secureUrl: data.secure_url,
  };
};
