import { StorageService, UploadResult, DeleteResult } from './StorageService';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './public/uploads';
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export class LocalStorageProvider extends StorageService {
  private uploadDir: string;

  constructor() {
    super();
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.ensureDir(this.uploadDir);
  }

  private ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'media'
  ): Promise<UploadResult> {
    const ext = path.extname(originalName);
    const fileName = `${uuidv4()}${ext}`;
    const folderPath = path.join(this.uploadDir, folder);
    this.ensureDir(folderPath);

    const filePath = path.join(folderPath, fileName);
    fs.writeFileSync(filePath, buffer);

    const storageKey = `uploads/${folder}/${fileName}`;
    const url = `${BASE_URL}/${storageKey}`;

    return {
      url,
      fileName,
      storageKey,
      provider: 'local',
    };
  }

  async delete(
    storageKey: string,
    _options?: { publicId?: string; resourceType?: string }
  ): Promise<DeleteResult> {
    try {
      const filePath = path.join(process.cwd(), 'public', storageKey);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: String(err) };
    }
  }

  getUrl(storageKey: string): string {
    return `${BASE_URL}/${storageKey}`;
  }
}
