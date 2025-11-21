import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';

interface ThumbnailOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  quality?: number;
}

export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  options: ThumbnailOptions = {}
): Promise<string> {
  const {
    width = 300,
    height = 300,
    fit = 'cover',
    quality = 80,
  } = options;

  try {
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    await sharp(inputPath)
      .resize(width, height, { fit })
      .jpeg({ quality })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    throw new Error('Failed to generate thumbnail');
  }
}

export async function generateMultipleThumbnails(
  inputPath: string,
  outputDir: string,
  filename: string
): Promise<{ small: string; medium: string; large: string }> {
  const sizes = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 800, height: 600 },
  };

  const thumbnails: any = {};

  for (const [size, dimensions] of Object.entries(sizes)) {
    const outputPath = path.join(outputDir, `${filename}_${size}.jpg`);
    await generateThumbnail(inputPath, outputPath, dimensions);
    thumbnails[size] = outputPath;
  }

  return thumbnails;
}

export function isSupportedImageFormat(mimetype: string): boolean {
  const supportedFormats = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ];

  return supportedFormats.includes(mimetype);
}

export function isSupportedVideoFormat(mimetype: string): boolean {
  const supportedFormats = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mpeg',
    'video/quicktime',
  ];

  return supportedFormats.includes(mimetype);
}

export async function getImageDimensions(
  imagePath: string
): Promise<{ width: number; height: number }> {
  try {
    const metadata = await sharp(imagePath).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
    };
  } catch (error) {
    throw new Error('Failed to get image dimensions');
  }
}

export async function compressImage(
  inputPath: string,
  outputPath: string,
  quality: number = 80
): Promise<string> {
  try {
    await sharp(inputPath)
      .jpeg({ quality, progressive: true })
      .toFile(outputPath);

    return outputPath;
  } catch (error) {
    throw new Error('Failed to compress image');
  }
}
