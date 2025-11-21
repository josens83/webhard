import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs';
import * as path from 'path';

interface StorageConfig {
  type: 'local' | 's3' | 'minio';
  s3?: {
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    endpoint?: string;
  };
  local?: {
    uploadDir: string;
  };
}

class FileStorage {
  private config: StorageConfig;
  private s3Client?: S3Client;

  constructor() {
    this.config = this.getConfig();

    if (this.config.type === 's3' || this.config.type === 'minio') {
      this.initializeS3Client();
    }
  }

  private getConfig(): StorageConfig {
    const storageType = process.env.STORAGE_TYPE || 'local';

    if (storageType === 'local') {
      return {
        type: 'local',
        local: {
          uploadDir: process.env.UPLOAD_DIR || './uploads',
        },
      };
    }

    if (storageType === 'minio') {
      return {
        type: 'minio',
        s3: {
          region: process.env.MINIO_REGION || 'us-east-1',
          accessKeyId: process.env.MINIO_ACCESS_KEY || 'minioadmin',
          secretAccessKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
          bucket: process.env.MINIO_BUCKET || 'webhard',
          endpoint: `http://${process.env.MINIO_ENDPOINT || 'localhost'}:${process.env.MINIO_PORT || '9000'}`,
        },
      };
    }

    // S3
    return {
      type: 's3',
      s3: {
        region: process.env.AWS_REGION || 'ap-northeast-2',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        bucket: process.env.AWS_S3_BUCKET!,
      },
    };
  }

  private initializeS3Client() {
    if (!this.config.s3) return;

    this.s3Client = new S3Client({
      region: this.config.s3.region,
      credentials: {
        accessKeyId: this.config.s3.accessKeyId,
        secretAccessKey: this.config.s3.secretAccessKey,
      },
      ...(this.config.s3.endpoint && {
        endpoint: this.config.s3.endpoint,
        forcePathStyle: true, // Required for MinIO
      }),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    destination: string
  ): Promise<{ path: string; url: string }> {
    if (this.config.type === 'local') {
      return this.uploadLocal(file, destination);
    }

    return this.uploadS3(file, destination);
  }

  private async uploadLocal(
    file: Express.Multer.File,
    destination: string
  ): Promise<{ path: string; url: string }> {
    const uploadDir = this.config.local!.uploadDir;
    const fullPath = path.join(uploadDir, destination);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Move file
    fs.renameSync(file.path, fullPath);

    return {
      path: destination,
      url: `/uploads/${destination}`,
    };
  }

  private async uploadS3(
    file: Express.Multer.File,
    destination: string
  ): Promise<{ path: string; url: string }> {
    if (!this.s3Client || !this.config.s3) {
      throw new Error('S3 client not initialized');
    }

    const fileContent = fs.readFileSync(file.path);

    const command = new PutObjectCommand({
      Bucket: this.config.s3.bucket,
      Key: destination,
      Body: fileContent,
      ContentType: file.mimetype,
    });

    await this.s3Client.send(command);

    // Clean up temp file
    fs.unlinkSync(file.path);

    const url = this.config.s3.endpoint
      ? `${this.config.s3.endpoint}/${this.config.s3.bucket}/${destination}`
      : `https://${this.config.s3.bucket}.s3.${this.config.s3.region}.amazonaws.com/${destination}`;

    return {
      path: destination,
      url,
    };
  }

  async getDownloadUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    if (this.config.type === 'local') {
      return `/uploads/${filePath}`;
    }

    if (!this.s3Client || !this.config.s3) {
      throw new Error('S3 client not initialized');
    }

    const command = new GetObjectCommand({
      Bucket: this.config.s3.bucket,
      Key: filePath,
    });

    const signedUrl = await getSignedUrl(this.s3Client, command, {
      expiresIn,
    });

    return signedUrl;
  }

  async deleteFile(filePath: string): Promise<void> {
    if (this.config.type === 'local') {
      const fullPath = path.join(this.config.local!.uploadDir, filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
      return;
    }

    if (!this.s3Client || !this.config.s3) {
      throw new Error('S3 client not initialized');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.config.s3.bucket,
      Key: filePath,
    });

    await this.s3Client.send(command);
  }

  async fileExists(filePath: string): Promise<boolean> {
    if (this.config.type === 'local') {
      const fullPath = path.join(this.config.local!.uploadDir, filePath);
      return fs.existsSync(fullPath);
    }

    try {
      if (!this.s3Client || !this.config.s3) {
        throw new Error('S3 client not initialized');
      }

      const command = new GetObjectCommand({
        Bucket: this.config.s3.bucket,
        Key: filePath,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const fileStorage = new FileStorage();
