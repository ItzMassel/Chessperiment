'use server';

import 'server-only';
import { auth } from "@/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const BUCKETS = ['avatars', 'marketplace-thumbnails'] as const;
type Bucket = typeof BUCKETS[number];

const ALLOWED_TYPES: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOAD_ROOT = path.join(process.cwd(), 'public', 'uploads');

export async function uploadImage(bucket: Bucket, formData: FormData): Promise<{ success: true; url: string } | { success: false; error: string }> {
    if (!BUCKETS.includes(bucket)) {
        return { success: false, error: 'Invalid bucket' };
    }

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
        return { success: false, error: 'Not authenticated' };
    }

    const file = formData.get('file');
    if (!(file instanceof File)) {
        return { success: false, error: 'No file provided' };
    }

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
        return { success: false, error: 'Unsupported file type' };
    }

    if (file.size > MAX_SIZE_BYTES) {
        return { success: false, error: 'File too large (max 5MB)' };
    }

    const safeUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const dir = path.join(UPLOAD_ROOT, bucket, safeUserId);
    const filename = `${Date.now()}.${ext}`;

    await mkdir(dir, { recursive: true });
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, filename), bytes);

    return { success: true, url: `/uploads/${bucket}/${safeUserId}/${filename}` };
}
