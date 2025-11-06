import React, { useState } from 'react';
import { uploadVehicleImage } from '../../../utils/cloudinary';

export interface CloudinaryUploadProps {
  onUploadSuccess?: (result: { publicId: string; secureUrl: string }) => void;
}

const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
    setPreviewUrl(selectedFile ? URL.createObjectURL(selectedFile) : '');
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Vui lòng chọn một ảnh để tải lên.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      const result = await uploadVehicleImage(file);
      setPreviewUrl(result.secureUrl);
      onUploadSuccess?.(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tải ảnh lên thất bại.';
      setError(message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="cloudinary-upload">
      <h2>Upload Ảnh Lên Cloudinary</h2>
      <input type="file" accept="image/*" onChange={handleSelectFile} />
      <button type="button" onClick={handleUpload} disabled={isUploading}>
        {isUploading ? 'Đang tải...' : 'Upload'}
      </button>

      {error && <p className="cloudinary-upload__error">{error}</p>}

      {previewUrl && (
        <div className="cloudinary-upload__preview">
          <h3>Ảnh đã upload</h3>
          <img src={previewUrl} alt="uploaded" width={250} />
          <p>URL: {previewUrl}</p>
        </div>
      )}
    </div>
  );
};

export default CloudinaryUpload;
