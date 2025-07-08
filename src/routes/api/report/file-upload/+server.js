import { json } from '@sveltejs/kit';
import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { spacesClient, getPublicObjectURL } from '$lib/server/s3/index.js';
import * as env from '$env/static/private';
import { randomUUID } from 'crypto';
import { submittedReports } from '$lib/server/db/schema.js';
import { db } from '$lib/server/db/index.js';
import { eq, or } from 'drizzle-orm';

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

        // Cleanup timer (if the file is unused after this timeout, delete it!)
        setTimeout(async () => {
            try {
                const reports = await db.select().from(submittedReports)
                    .where(or(eq(submittedReports.screenshotKey, key), eq(submittedReports.videoKey, key)))
                    .limit(1);
                if (!reports.length) await spacesClient.send(new DeleteObjectCommand({ Bucket: env.SPACES_BUCKET_NAME, Key: key }));
                console.log(`Unused file with key ${key} was deleted.`);
            } catch (error) {
                console.error('File upload cleanup error:', error);
            }
        }, 10 * 60 * 1000); // 10 minutes

        return json({ url });

    } catch (error) {
        console.error('Upload error:', error);
        return json({ error: 'Upload failed: ' + error.message }, { status: 500 });
    }
}