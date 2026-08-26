import { v2 as cloudinary } from "cloudinary";

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return null;
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  return cloudinary;
}

export function isImageStorageConfigured(): boolean {
  return Boolean(getCloudinaryConfig());
}

export async function uploadScanImages(
  images: Array<{ data: string; mimeType: string }>,
  userId: string,
  requestId: string
): Promise<string[]> {
  const client = getCloudinaryConfig();
  if (!client) {
    return images.map((image) => {
      if (image.data.startsWith("http://") || image.data.startsWith("https://") || image.data.startsWith("data:")) {
        return image.data;
      }
      return `data:${image.mimeType || "image/jpeg"};base64,${image.data}`;
    });
  }

  try {
    const uploaded = await Promise.all(images.map(async (image, index) => {
      const source = image.data.startsWith("http://") || image.data.startsWith("https://")
        ? image.data
        : image.data.startsWith("data:") ? image.data : `data:${image.mimeType};base64,${image.data}`;
      const result = await client.uploader.upload(source, {
        folder: `nutrisync/${userId}/scans`,
        public_id: `${requestId}-${index}`,
        resource_type: "image",
        overwrite: false,
      });
      return result.secure_url;
    }));
    return uploaded;
  } catch (err) {
    console.warn("⚠️ Cloudinary upload warning, using local image URI:", err);
    return images.map((image) => {
      if (image.data.startsWith("http://") || image.data.startsWith("https://") || image.data.startsWith("data:")) {
        return image.data;
      }
      return `data:${image.mimeType || "image/jpeg"};base64,${image.data}`;
    });
  }
}
