import { json } from '@sveltejs/kit';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { spacesClient, getPublicObjectURL } from '$lib/server/s3/index.js';
import * as env from '$env/static/private';
import { randomUUID } from 'crypto';

const MAX_IMAGE_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_IMAGE_STRING = "3MB";
const MAX_VIDEO_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_VIDEO_STRING = "25MB";

export async function POST({ request }) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || !file.size) return json({ error: 'No file provided' }, { status: 400 });

        const isImage = file.type.startsWith('image/');
        const isVideo = file.type.startsWith('video/');

        if (!isImage && !isVideo) return json({ error: 'Only images and videos are allowed' }, { status: 400 });

        const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
        if (file.size > maxSize) {
            const limit = isImage ? MAX_IMAGE_STRING : MAX_VIDEO_STRING;
            return json({ error: `File too large. ${isImage ? 'Images' : 'Videos'} must be under ${limit}` }, { status: 400 });
        }

        // Generate unique filename
        const ext = file.name.split('.').pop(); // File extension
        const key = `bugspot/${randomUUID()}.${ext}`;

        // Upload to S3
        const buffer = await file.arrayBuffer();
        const command = new PutObjectCommand({
            Bucket: env.SPACES_BUCKET_NAME,
            Key: key,
            Body: new Uint8Array(buffer),
            ContentType: file.type,
            ACL: 'public-read'
        });

        await spacesClient.send(command);
        const url = getPublicObjectURL(key);

        return json({ url });

    } catch (error) {
        console.error('Upload error:', error);
        return json({ error: 'Upload failed' }, { status: 500 });
    }
}