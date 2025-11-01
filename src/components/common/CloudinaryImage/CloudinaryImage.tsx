import React, { useMemo } from 'react';
import { AdvancedImage } from '@cloudinary/react';
import { buildVehicleImage, isCloudinaryPublicId } from '../../../utils/cloudinary';

type AdvancedImageOmittedProps = Omit<React.ComponentProps<typeof AdvancedImage>, 'cldImg'>;

export interface CloudinaryImageProps extends AdvancedImageOmittedProps {
  /**
   * Cloudinary public ID or absolute URL. When an absolute URL is provided the component will
   * fall back to rendering a native img tag so existing assets keep working.
   */
  src?: string | null;
  alt: string;
  width?: number;
  height?: number;
  /** Allow opting out of the default square crop. */
  cropToSquare?: boolean;
  /** Rendered when no source is available. */
  fallback?: React.ReactNode;
  className?: string;
}

const CloudinaryImage: React.FC<CloudinaryImageProps> = ({
  src,
  alt,
  width = 500,
  height = 500,
  cropToSquare = true,
  fallback = null,
  className,
  ...imgProps
}) => {
  const shouldUseCloudinary = isCloudinaryPublicId(src);

  const cloudinaryImage = useMemo(() => {
    if (!shouldUseCloudinary || !src) {
      return null;
    }

    try {
      return buildVehicleImage(src, { width, height, cropToSquare });
    } catch (error) {
      console.error('Failed to build Cloudinary image', error);
      return null;
    }
  }, [cropToSquare, height, shouldUseCloudinary, src, width]);

  if (!src && fallback) {
    return <>{fallback}</>;
  }

  if (!src) {
    return null;
  }

  if (shouldUseCloudinary && cloudinaryImage) {
    return (
      <AdvancedImage
        cldImg={cloudinaryImage}
        alt={alt}
        className={className}
        {...imgProps}
      />
    );
  }

  return <img src={src} alt={alt} className={className} {...imgProps} />;
};

export default CloudinaryImage;
