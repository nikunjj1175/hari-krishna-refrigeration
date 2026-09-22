import { StorageService } from './StorageService';
import { LocalStorageProvider } from './LocalStorageProvider';
import { CloudinaryStorageProvider } from './CloudinaryStorageProvider';

let instance: StorageService | null = null;

/**
 * Factory to get the configured storage provider.
 * Default is Cloudinary so photos are not stored in MongoDB or local disk.
 */
export function getStorageService(): StorageService {
  if (!instance) {
    const provider = process.env.STORAGE_PROVIDER || 'cloudinary';

    switch (provider) {
      case 'local':
        instance = new LocalStorageProvider();
        break;
      case 'cloudinary':
      default:
        instance = new CloudinaryStorageProvider();
        break;
    }
  }
  return instance;
}

export { StorageService };
