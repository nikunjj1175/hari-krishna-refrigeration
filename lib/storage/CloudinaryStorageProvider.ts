import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { StorageService, UploadResult, DeleteResult } from './StorageService';

type CloudinaryResource = 'image' | 'video' | 'raw';

function resourceType(mimeType: string): CloudinaryResource {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'raw';
}

function configured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export class CloudinaryStorageProvider extends StorageService {
  constructor() {
    super();
    if (!configured()) {
      throw new Error(
        'Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.'
      );
    }
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'media'
  ): Promise<UploadResult> {
    const ext = path.extname(originalName);
    const fileName = `${uuidv4()}${ext}`;
    const publicId = `hari-krishna-refrigeration/${folder}/${uuidv4()}`;
    const type = resourceType(mimeType);

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: type,
          overwrite: false,
          unique_filename: true,
        },
        (error, uploaded) => {
          if (error || !uploaded) {
            reject(error || new Error('Cloudinary upload failed'));
            return;
          }
          resolve(uploaded);
        }
      );
      stream.end(buffer);
    });

    return {
      url: result.secure_url,
      fileName,
      storageKey: result.public_id,
      publicId: result.public_id,
      provider: 'cloudinary',
    };
  }

  async delete(
    storageKey: string,
    options?: { publicId?: string; resourceType?: string }
  ): Promise<DeleteResult> {
    try {
      const publicId = options?.publicId || storageKey;
      const type = (options?.resourceType as CloudinaryResource | undefined) || 'image';
      await cloudinary.uploader.destroy(publicId, { resource_type: type });
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  getUrl(storageKey: string): string {
    return cloudinary.url(storageKey, { secure: true });
  }
}
