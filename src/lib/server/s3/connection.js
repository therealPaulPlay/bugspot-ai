import { env } from '$env/dynamic/private';
const { S3Client } = require('@aws-sdk/client-s3');

// Spaces connection
const spacesClient = new S3Client({
    region: 'fra1',  // Required by the S3 client
    endpoint: 'https://fra1.digitaloceanspaces.com',  // Non-CDN endpoint for API interactions other than GET
    credentials: {
        accessKeyId: env.SPACES_ACCESS_KEY_ID,
        secretAccessKey: env.SPACES_SECRET_ACCESS_KEY,
    }
});

// Get file URL – direct URL for publicly readable objects
async function getPublicObjectURL(key) {
    return `https://${env.SPACES_BUCKET_NAME}.fra1.digitaloceanspaces.com/${key}`;
}

module.exports = {
    spacesClient,
    getPublicObjectURL
};