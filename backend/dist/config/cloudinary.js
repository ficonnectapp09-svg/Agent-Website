"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadBase64ToS3 = exports.uploadToS3 = exports.uploadBase64ToCloudinary = exports.getPresignedViewUrl = exports.extractS3Key = exports.EXTENSION_TO_MIME = exports.ALLOWED_MIME_MAP = exports.cloudinary = void 0;
exports.extractCloudinaryPublicId = extractCloudinaryPublicId;
exports.getDurableImageUrl = getDurableImageUrl;
exports.getPresignedUrl = getPresignedUrl;
exports.getObjectStream = getObjectStream;
exports.uploadToCloudinary = uploadToCloudinary;
exports.deleteFromCloudinary = deleteFromCloudinary;
const cloudinary_1 = require("cloudinary");
Object.defineProperty(exports, "cloudinary", { enumerable: true, get: function () { return cloudinary_1.v2; } });
const dotenv_1 = __importDefault(require("dotenv"));
const crypto_1 = __importDefault(require("crypto"));
dotenv_1.default.config();
// Configure Cloudinary with user credentials / environment variables
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'r6vovvet';
const API_KEY = process.env.CLOUDINARY_API_KEY || '168714678711119';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || 'jbKogCLVFjo-5fZwDdUt23h6OeI';
const CLOUDINARY_URL = process.env.CLOUDINARY_URL || 'cloudinary://168714678711119:jbKogCLVFjo-5fZwDdUt23h6OeI@r6vovvet';
cloudinary_1.v2.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
    secure: true
});
// Allowed MIME mappings
exports.ALLOWED_MIME_MAP = {
    // Images (Max 15MB)
    'image/jpeg': { ext: 'jpg', category: 'image', maxSizeBytes: 15 * 1024 * 1024 },
    'image/jpg': { ext: 'jpg', category: 'image', maxSizeBytes: 15 * 1024 * 1024 },
    'image/png': { ext: 'png', category: 'image', maxSizeBytes: 15 * 1024 * 1024 },
    'image/webp': { ext: 'webp', category: 'image', maxSizeBytes: 15 * 1024 * 1024 },
    'image/gif': { ext: 'gif', category: 'image', maxSizeBytes: 15 * 1024 * 1024 },
    'image/svg+xml': { ext: 'svg', category: 'image', maxSizeBytes: 5 * 1024 * 1024 },
    // Documents (Max 25MB)
    'application/pdf': { ext: 'pdf', category: 'document', maxSizeBytes: 25 * 1024 * 1024 },
    'application/msword': { ext: 'doc', category: 'document', maxSizeBytes: 25 * 1024 * 1024 },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: 'docx', category: 'document', maxSizeBytes: 25 * 1024 * 1024 },
    'text/plain': { ext: 'txt', category: 'document', maxSizeBytes: 10 * 1024 * 1024 },
    // Audio (Max 30MB)
    'audio/webm': { ext: 'webm', category: 'audio', maxSizeBytes: 30 * 1024 * 1024 },
    'audio/mp3': { ext: 'mp3', category: 'audio', maxSizeBytes: 30 * 1024 * 1024 },
    'audio/mpeg': { ext: 'mp3', category: 'audio', maxSizeBytes: 30 * 1024 * 1024 },
    'audio/wav': { ext: 'wav', category: 'audio', maxSizeBytes: 30 * 1024 * 1024 },
    'audio/x-wav': { ext: 'wav', category: 'audio', maxSizeBytes: 30 * 1024 * 1024 },
    'audio/ogg': { ext: 'ogg', category: 'audio', maxSizeBytes: 30 * 1024 * 1024 },
    'audio/m4a': { ext: 'm4a', category: 'audio', maxSizeBytes: 30 * 1024 * 1024 },
    'audio/x-m4a': { ext: 'm4a', category: 'audio', maxSizeBytes: 30 * 1024 * 1024 },
    'audio/mp4': { ext: 'm4a', category: 'audio', maxSizeBytes: 30 * 1024 * 1024 },
    'audio/aac': { ext: 'aac', category: 'audio', maxSizeBytes: 30 * 1024 * 1024 },
    // Video (Max 50MB)
    'video/mp4': { ext: 'mp4', category: 'video', maxSizeBytes: 50 * 1024 * 1024 },
    'video/webm': { ext: 'webm', category: 'video', maxSizeBytes: 50 * 1024 * 1024 }
};
exports.EXTENSION_TO_MIME = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    mp3: 'audio/mp3',
    wav: 'audio/wav',
    webm: 'audio/webm',
    ogg: 'audio/ogg',
    m4a: 'audio/m4a',
    aac: 'audio/aac',
    mp4: 'video/mp4'
};
/**
 * Extracts publicId from Cloudinary URL or key
 */
function extractCloudinaryPublicId(urlOrKey) {
    if (!urlOrKey || typeof urlOrKey !== 'string')
        return '';
    const trimmed = urlOrKey.trim();
    if (trimmed.includes('cloudinary.com')) {
        const match = trimmed.match(/\/upload\/(?:v\d+\/)?([^?#]+)/);
        if (match && match[1]) {
            // Remove extension if present
            return match[1].replace(/\.[^/.]+$/, '');
        }
    }
    return trimmed.replace(/^\/+/, '');
}
exports.extractS3Key = extractCloudinaryPublicId;
/**
 * Returns a durable Cloudinary URL for a given publicId
 */
function getDurableImageUrl(publicIdOrUrl, resourceType = 'auto') {
    if (!publicIdOrUrl)
        return '';
    const trimmed = publicIdOrUrl.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
    }
    const cleanId = extractCloudinaryPublicId(trimmed);
    return cloudinary_1.v2.url(cleanId, {
        secure: true,
        resource_type: resourceType === 'auto' ? 'image' : resourceType
    });
}
/**
 * Get direct view URL
 */
async function getPresignedUrl(publicIdOrUrl, _expiresInSeconds = 3600) {
    if (!publicIdOrUrl)
        return '';
    if (publicIdOrUrl.startsWith('http://') || publicIdOrUrl.startsWith('https://')) {
        return publicIdOrUrl;
    }
    return getDurableImageUrl(publicIdOrUrl);
}
exports.getPresignedViewUrl = getPresignedUrl;
/**
 * Stub for getObjectStream if any legacy controller proxies media
 */
async function getObjectStream(publicIdOrUrl) {
    const url = await getPresignedUrl(publicIdOrUrl);
    return {
        body: null,
        contentType: 'application/octet-stream',
        contentLength: undefined
    };
}
/**
 * Uploads Images, Documents, Voice/Audio, or Video to Cloudinary.
 * Accepts base64 DataURI, Buffer, remote URL, or file path.
 */
async function uploadToCloudinary(fileInput, folder = 'agent_docs', filenameHint) {
    try {
        let uploadTarget;
        let mimeType = 'application/octet-stream';
        let originalName = filenameHint || 'file';
        if (typeof fileInput === 'string') {
            const trimmed = fileInput.trim();
            // Already a remote URL (Cloudinary or otherwise)
            if (trimmed.startsWith('https://res.cloudinary.com') || (trimmed.startsWith('http') && !trimmed.startsWith('data:'))) {
                return {
                    success: true,
                    url: trimmed,
                    secure_url: trimmed,
                    durableUrl: trimmed,
                    key: extractCloudinaryPublicId(trimmed),
                    publicId: extractCloudinaryPublicId(trimmed),
                    public_id: extractCloudinaryPublicId(trimmed),
                    size: 0,
                    toString() { return trimmed; }
                };
            }
            if (trimmed.startsWith('data:')) {
                const mimeMatch = trimmed.match(/^data:([^;]+);base64,/);
                if (mimeMatch && mimeMatch[1]) {
                    mimeType = mimeMatch[1].toLowerCase().trim();
                }
                uploadTarget = trimmed;
            }
            else {
                uploadTarget = trimmed;
            }
        }
        else if (Buffer.isBuffer(fileInput)) {
            uploadTarget = `data:application/octet-stream;base64,${fileInput.toString('base64')}`;
        }
        else {
            throw new Error('Unsupported file input format for Cloudinary upload.');
        }
        const mimeConfig = exports.ALLOWED_MIME_MAP[mimeType] || {
            ext: 'bin',
            category: 'other',
            maxSizeBytes: 25 * 1024 * 1024
        };
        const safeFolder = folder.replace(/^\/+|\/+$/g, '') || 'agent_docs';
        const randSuffix = crypto_1.default.randomBytes(6).toString('hex');
        const safeBaseName = (filenameHint || 'asset').replace(/[^a-zA-Z0-9_-]/g, '_');
        const publicId = `${safeBaseName}_${Date.now()}_${randSuffix}`;
        // Upload to Cloudinary with automatic resource type detection
        const uploadRes = await cloudinary_1.v2.uploader.upload(uploadTarget, {
            folder: safeFolder,
            public_id: publicId,
            resource_type: 'auto',
            overwrite: true,
            use_filename: true
        });
        const secureUrl = uploadRes.secure_url || uploadRes.url;
        return {
            success: true,
            url: secureUrl,
            secure_url: secureUrl,
            durableUrl: secureUrl,
            key: uploadRes.public_id,
            publicId: uploadRes.public_id,
            public_id: uploadRes.public_id,
            category: mimeConfig.category,
            mimeType: mimeType !== 'application/octet-stream' ? mimeType : (uploadRes.format ? `image/${uploadRes.format}` : mimeType),
            contentType: mimeType,
            extension: uploadRes.format || mimeConfig.ext,
            format: uploadRes.format,
            resource_type: uploadRes.resource_type,
            size: uploadRes.bytes,
            bytes: uploadRes.bytes,
            originalName,
            toString() { return secureUrl; }
        };
    }
    catch (err) {
        console.error('[Cloudinary Upload Error]:', err.message || err);
        return {
            success: false,
            url: '',
            secure_url: '',
            durableUrl: '',
            key: '',
            publicId: '',
            public_id: '',
            error: err.message || 'Failed to upload file to Cloudinary',
            toString() { return ''; }
        };
    }
}
/**
 * Delete asset from Cloudinary
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
    try {
        return await cloudinary_1.v2.uploader.destroy(publicId, { resource_type: resourceType });
    }
    catch (err) {
        console.error('[Cloudinary Delete Error]:', err.message || err);
        return { result: 'error', error: err.message };
    }
}
// Aliases for full backward compatibility
exports.uploadBase64ToCloudinary = uploadToCloudinary;
exports.uploadToS3 = uploadToCloudinary;
exports.uploadBase64ToS3 = uploadToCloudinary;
//# sourceMappingURL=cloudinary.js.map