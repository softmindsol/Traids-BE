import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class S3UploadService {
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor() {
    this.region = process.env.AWS_REGION || 'eu-west-2';
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });
    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'traids-uploads';
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
  ): Promise<string> {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(putCommand);

      // Generate a presigned URL for public access (valid for 7 days)
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const publicUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: 604800, // 7 days in seconds
      });

      return publicUrl;
    } catch (error) {
      throw new HttpException(
        'Failed to upload file to S3',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    folder: string,
  ): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }
}
