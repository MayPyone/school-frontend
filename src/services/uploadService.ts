import type { UUID } from "../types/api";
import { resizeImageFile } from "../lib/imageResize";
import { api } from "./http";

interface UploadImageOptions {
  folder: string;
  schoolId?: UUID;
  maxWidth?: number;
  maxHeight?: number;
  maxSizeBytes?: number;
}

interface ImageUploadResponse {
  key: string;
  publicUrl: string;
  contentType: string;
}

export const uploadService = {
  async uploadImage(file: File, options: UploadImageOptions): Promise<string> {
    const resizedFile = await resizeImageFile(file, {
      maxWidth: options.maxWidth,
      maxHeight: options.maxHeight,
      maxSizeBytes: options.maxSizeBytes,
      outputType: "image/webp",
    });
    const formData = new FormData();
    formData.append("file", resizedFile);
    formData.append("folder", options.folder);
    if (options.schoolId) {
      formData.append("schoolId", options.schoolId);
    }

    const { data } = await api.post<ImageUploadResponse>("/uploads/images", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return data.publicUrl;
  },

  async deleteImage(publicUrl: string): Promise<void> {
    await api.delete("/uploads/images", {
      params: { publicUrl },
    });
  },
};
