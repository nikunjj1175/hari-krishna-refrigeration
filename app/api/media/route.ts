import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Media from '@/models/Media';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
  validateSession,
  getPaginationParams,
} from '@/lib/utils/api';
import { getStorageService } from '@/lib/storage';
import { ALLOWED_MIME, MAX_UPLOAD_BYTES } from '@/lib/constants';

function detectType(mime: string): 'image' | 'video' | 'document' | null {
  if (ALLOWED_MIME.image.includes(mime)) return 'image';
  if (ALLOWED_MIME.video.includes(mime)) return 'video';
  if (ALLOWED_MIME.document.includes(mime)) return 'document';
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const { page, limit, skip } = getPaginationParams(req.url);
    const fileType = new URL(req.url).searchParams.get('fileType') || '';
    const filter: Record<string, unknown> = {};
    if (fileType) filter.fileType = fileType;

    const [items, total] = await Promise.all([
      Media.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Media.countDocuments(filter),
    ]);

    return paginatedResponse(items, total, page, limit);
  } catch {
    return errorResponse('Failed to fetch media');
  }
}

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await validateSession();
    if (error) return error;

    const form = await req.formData();
    const file = form.get('file');
    if (!(file instanceof File)) return errorResponse('File is required', 400);

    const mime = file.type;
    const fileType = detectType(mime);
    if (!fileType) return errorResponse('Unsupported file type', 400);

    if (file.size > MAX_UPLOAD_BYTES[fileType]) {
      return errorResponse(`File exceeds the ${fileType} size limit`, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let uploaded;
    try {
      uploaded = await getStorageService().upload(buffer, file.name, mime, fileType);
    } catch (err) {
      console.error('Cloudinary upload', err);
      return errorResponse(
        err instanceof Error ? err.message : 'Failed to upload file to Cloudinary',
        502
      );
    }

    await connectDB();
    const media = await Media.create({
      fileName: uploaded.fileName,
      originalName: file.name,
      fileType,
      mimeType: mime,
      fileSize: file.size,
      url: uploaded.url,
      storageProvider: uploaded.provider,
      storageKey: uploaded.storageKey,
      publicId: uploaded.publicId,
      uploadedBy: session?.user.id,
    });

    return successResponse(media, 201);
  } catch (err) {
    console.error('POST /api/media', err);
    return errorResponse('Failed to upload media');
  }
}
