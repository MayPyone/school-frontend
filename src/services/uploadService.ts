import type { ImageUploadPresignResponse } from "../types/api";
import { resizeImageFile } from "../lib/imageResize";
import { api } from "./http";

interface UploadImageOptions {
  folder: string;
  maxWidth?: number;
  maxHeight?: number;
}

export const uploadService = {
  async uploadImage(file: File, options: UploadImageOptions): Promise<string> {
    const resizedFile = await resizeImageFile(file, {
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      outputType: "image/webp",
    });

    const { data } = await api.post<ImageUploadPresignResponse>("/uploads/images/presign", {
      originalFilename: resizedFile.name,
      contentType: resizedFile.type,
      folder: options.folder,
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
};
