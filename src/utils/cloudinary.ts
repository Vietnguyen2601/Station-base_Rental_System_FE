import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';
import { ICloudinaryImage } from '@cloudinary/url-gen/assets/CloudinaryImage';

const CLOUD_NAME = 'dp73ww7yl';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

let cloudinaryInstance: Cloudinary | null = null;

const getCloudinary = (): Cloudinary => {
  if (!cloudinaryInstance) {
    cloudinaryInstance = new Cloudinary({ cloud: { cloudName: CLOUD_NAME } });
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
): ICloudinaryImage => {
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

  if (!CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      'Chưa cấu hình upload preset cho Cloudinary. Vui lòng thiết lập biến môi trường VITE_CLOUDINARY_UPLOAD_PRESET.'
    );
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
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
