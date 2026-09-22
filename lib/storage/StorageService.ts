export interface UploadResult {
  url: string;
  fileName: string;
  storageKey: string;
  publicId?: string;
  provider: 'local' | 'cloudinary' | 's3';
}

export interface DeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Abstract storage service interface.
 * Implementations can be swapped without changing media upload logic.
 */
export abstract class StorageService {
  abstract upload(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder?: string
  ): Promise<UploadResult>;

  abstract delete(
    storageKey: string,
    options?: { publicId?: string; resourceType?: string }
  ): Promise<DeleteResult>;

  abstract getUrl(storageKey: string): string;
}
