import * as env from '$env/static/private';
import { S3Client } from '@aws-sdk/client-s3';

const baseDomain = "fra1.digitaloceanspaces.com";

// Spaces connection
export const spacesClient = new S3Client({
    region: 'fra1',  // Required by the S3 client
    endpoint: 'https://' + baseDomain,  // Non-CDN endpoint for API interactions other than GET
    credentials: {
        accessKeyId: env.SPACES_ACCESS_KEY_ID,
        secretAccessKey: env.SPACES_SECRET_ACCESS_KEY,
    }
});

export function getBaseURL() {
    return `https://${env.SPACES_BUCKET_NAME}.${baseDomain}`;
}