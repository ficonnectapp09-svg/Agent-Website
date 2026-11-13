import { v2 as cloudinary } from 'cloudinary';
export { cloudinary };
export interface CloudinaryUploadResult {
    success: boolean;
    url: string;
    secure_url: string;
    durableUrl: string;
    key: string;
    publicId: string;
    public_id: string;
    category?: 'image' | 'document' | 'audio' | 'video' | 'other';
    mimeType?: string;
    contentType?: string;
    extension?: string;
    size?: number;
    bytes?: number;
    originalName?: string;
    format?: string;
    resource_type?: string;
    error?: string;
    toString: () => string;
}
export declare const ALLOWED_MIME_MAP: Record<string, {
    ext: string;
    category: 'image' | 'document' | 'audio' | 'video';
    maxSizeBytes: number;
}>;
export declare const EXTENSION_TO_MIME: Record<string, string>;
/**
 * Extracts publicId from Cloudinary URL or key
 */
export declare function extractCloudinaryPublicId(urlOrKey: string): string;
export declare const extractS3Key: typeof extractCloudinaryPublicId;
/**
 * Returns a durable Cloudinary URL for a given publicId
 */
export declare function getDurableImageUrl(publicIdOrUrl: string, resourceType?: 'image' | 'video' | 'raw' | 'auto'): string;
/**
 * Get direct view URL
 */
export declare function getPresignedUrl(publicIdOrUrl: string, _expiresInSeconds?: number): Promise<string>;
export declare const getPresignedViewUrl: typeof getPresignedUrl;
/**
 * Stub for getObjectStream if any legacy controller proxies media
 */
export declare function getObjectStream(publicIdOrUrl: string): Promise<{
    body: any;
    contentType: string;
    contentLength?: number;
}>;
/**
 * Uploads Images, Documents, Voice/Audio, or Video to Cloudinary.
 * Accepts base64 DataURI, Buffer, remote URL, or file path.
 */
export declare function uploadToCloudinary(fileInput: string | Buffer, folder?: string, filenameHint?: string): Promise<CloudinaryUploadResult>;
/**
 * Delete asset from Cloudinary
 */
export declare function deleteFromCloudinary(publicId: string, resourceType?: 'image' | 'video' | 'raw'): Promise<any>;
export declare const uploadBase64ToCloudinary: typeof uploadToCloudinary;
export declare const uploadToS3: typeof uploadToCloudinary;
export declare const uploadBase64ToS3: typeof uploadToCloudinary;
//# sourceMappingURL=cloudinary.d.ts.map