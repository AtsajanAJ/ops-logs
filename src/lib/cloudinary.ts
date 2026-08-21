import { v2 as cloudinary } from "cloudinary";

export const CLOUDINARY_UPLOAD_FOLDER = "ops-logs/incidents";

export function isCloudinaryConfigured(): boolean {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export interface CloudinaryUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: string;
}

export function signUpload(
  folder = CLOUDINARY_UPLOAD_FOLDER,
): CloudinaryUploadSignature {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary is not configured.");
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    apiSecret,
  );

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder,
  };
}
