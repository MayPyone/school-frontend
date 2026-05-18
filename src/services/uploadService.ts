import type { ImageUploadPresignResponse, UUID } from "../types/api";
import { resizeImageFile } from "../lib/imageResize";
import { api } from "./http";

interface UploadImageOptions {
  folder: string;
  schoolId?: UUID;
  maxWidth?: number;
  maxHeight?: number;
  maxSizeBytes?: number;
}

export const uploadService = {
  async uploadImage(file: File, options: UploadImageOptions): Promise<string> {
    const resizedFile = await resizeImageFile(file, {
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      maxSizeBytes: options.maxSizeBytes,
      outputType: "image/webp",
    });
    const folder = options.schoolId ? `${options.folder}/${options.schoolId}` : options.folder;

    const { data } = await api.post<ImageUploadPresignResponse>("/uploads/images/presign", {
      originalFilename: resizedFile.name,
      contentType: resizedFile.type,
      folder,
      schoolId: options.schoolId,
    });

    const response = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": resizedFile.type,
      },
      body: resizedFile,
    });

    if (!response.ok) {
      throw new Error("Image upload to Supabase Storage failed.");
    }

    return data.publicUrl;
  },

  async deleteImage(publicUrl: string): Promise<void> {
    await api.delete("/uploads/images", {
      params: { publicUrl },
    });
  },
};
