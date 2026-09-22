export type MediaFileType = 'image' | 'video' | 'document';

export interface Media {
  _id: string;
  fileName: string;
  originalName: string;
  fileType: MediaFileType;
  mimeType: string;
  fileSize: number;
  url: string;
  storageProvider: 'local' | 'cloudinary' | 's3';
  storageKey?: string;
  publicId?: string;
  createdAt: string;
  updatedAt: string;
}
