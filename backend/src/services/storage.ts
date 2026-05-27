/**
 * SMART FILE STORAGE SERVICE
 * Auto-detects which provider based on environment variables.
 * Priority: Cloudinary → AWS S3 → Backblaze B2 → Uploadcare → Local
 *
 * Set ONE of these in Railway Variables:
 *   CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET → Cloudinary
 *   AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY + S3_BUCKET              → AWS S3
 *   B2_APPLICATION_KEY_ID + B2_APPLICATION_KEY + B2_BUCKET_ID          → Backblaze B2
 *   UPLOADCARE_PUBLIC_KEY + UPLOADCARE_SECRET_KEY                       → Uploadcare
 */
import axios from 'axios';
import { v2 as cloudinary } from 'cloudinary';
import crypto from 'crypto';

interface UploadOptions {
  buffer: Buffer;
  mimetype: string;
  folder: string;
  filename?: string;
  transformation?: string; // e.g. "w_400,h_400,c_fill"
}

interface UploadResult {
  url: string;
  publicId?: string;
}

function getProvider(): string {
  if (process.env.CLOUDINARY_CLOUD_NAME) return 'cloudinary';
  if (process.env.AWS_ACCESS_KEY_ID)     return 's3';
  if (process.env.B2_APPLICATION_KEY_ID) return 'backblaze';
  if (process.env.UPLOADCARE_PUBLIC_KEY) return 'uploadcare';
  return 'local';
}

const provider = getProvider();
console.log(`🗄️  Storage provider: ${provider}`);

// Configure Cloudinary if active
if (provider === 'cloudinary') {
  cloudinary.config({
    cloud_name:  process.env.CLOUDINARY_CLOUD_NAME,
    api_key:     process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadFile(opts: UploadOptions): Promise<UploadResult> {
  const { buffer, mimetype, folder, filename } = opts;

  switch (provider) {

    case 'cloudinary': {
      const result: any = await new Promise((resolve, reject) => {
        const resourceType = mimetype.startsWith('video') ? 'video' : 'image';
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: `skilltok-${folder}`, resource_type: resourceType },
          (err, res) => err ? reject(err) : resolve(res)
        );
        uploadStream.end(buffer);
      });
      return { url: result.secure_url, publicId: result.public_id };
    }

    case 's3': {
      // Use AWS SDK v3
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId:     process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        }
      });
      const key = `${folder}/${Date.now()}-${filename || crypto.randomUUID()}`;
      await s3.send(new PutObjectCommand({
        Bucket:      process.env.S3_BUCKET || '',
        Key:         key,
        Body:        buffer,
        ContentType: mimetype,
        ACL:         'public-read' as any
      }));
      const url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;
      return { url, publicId: key };
    }

    case 'backblaze': {
      // Backblaze B2 via S3-compatible API
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const b2 = new S3Client({
        endpoint:    `https://s3.${process.env.B2_REGION || 'us-west-004'}.backblazeb2.com`,
        region:      process.env.B2_REGION || 'us-west-004',
        credentials: {
          accessKeyId:     process.env.B2_APPLICATION_KEY_ID || '',
          secretAccessKey: process.env.B2_APPLICATION_KEY    || '',
        }
      });
      const key = `${folder}/${Date.now()}-${filename || crypto.randomUUID()}`;
      await b2.send(new PutObjectCommand({
        Bucket:      process.env.B2_BUCKET_NAME || '',
        Key:         key,
        Body:        buffer,
        ContentType: mimetype
      }));
      const url = `https://f${process.env.B2_BUCKET_ID}.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${key}`;
      return { url, publicId: key };
    }

    case 'uploadcare': {
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      form.append('UPLOADCARE_PUB_KEY', process.env.UPLOADCARE_PUBLIC_KEY || '');
      form.append('UPLOADCARE_STORE', '1');
      form.append('file', buffer, { filename: filename || 'upload', contentType: mimetype });
      const res = await axios.post('https://upload.uploadcare.com/base/', form, {
        headers: form.getHeaders()
      });
      const uuid = res.data.file;
      return { url: `https://ucarecdn.com/${uuid}/`, publicId: uuid };
    }

    default: {
      // Local fallback — saves to /tmp (not persistent on Railway, use only for dev)
      const fs = await import('fs');
      const path = await import('path');
      const dir = `/tmp/skilltok-uploads/${folder}`;
      fs.mkdirSync(dir, { recursive: true });
      const fname = `${Date.now()}-${filename || 'file'}`;
      fs.writeFileSync(path.join(dir, fname), buffer);
      console.warn(`⚠️  Using local storage (not persistent). File: ${fname}`);
      return { url: `/uploads/${folder}/${fname}` };
    }
  }
}

export async function deleteFile(publicId: string): Promise<void> {
  switch (provider) {
    case 'cloudinary': {
      await cloudinary.uploader.destroy(publicId);
      break;
    }
    case 's3': {
      const { S3Client, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      const s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        }
      });
      await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET || '', Key: publicId }));
      break;
    }
    default: break;
  }
}
