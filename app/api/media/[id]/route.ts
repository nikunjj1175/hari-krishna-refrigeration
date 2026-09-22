import { NextRequest } from 'next/server';
import connectDB from '@/lib/db/mongoose';
import Media from '@/models/Media';
import { successResponse, errorResponse, validateSession } from '@/lib/utils/api';
import { getStorageService } from '@/lib/storage';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { error } = await validateSession();
    if (error) return error;

    await connectDB();
    const media = await Media.findById(params.id);
    if (!media) return errorResponse('Media not found', 404);

    if (media.storageKey || media.publicId) {
      const resourceType =
        media.fileType === 'video' ? 'video' : media.fileType === 'document' ? 'raw' : 'image';
      await getStorageService().delete(media.storageKey || media.publicId, {
        publicId: media.publicId,
        resourceType,
      });
    }
    await Media.findByIdAndDelete(params.id);
    return successResponse({ message: 'Media deleted' });
  } catch {
    return errorResponse('Failed to delete media');
  }
}
