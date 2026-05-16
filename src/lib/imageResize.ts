interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: "image/jpeg" | "image/webp" | "image/png";
}

export async function resizeImageFile(file: File, options: ResizeOptions = {}): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    outputType = "image/webp",
  } = options;

  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width, maxHeight / bitmap.height);
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image resizing is not supported by this browser.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Could not resize image."));
      }
    }, outputType, quality);
  });

  const extension = outputType === "image/png" ? "png" : outputType === "image/jpeg" ? "jpg" : "webp";
  const filename = replaceExtension(file.name, extension);
  return new File([blob], filename, { type: outputType });
}

function replaceExtension(filename: string, extension: string) {
  const basename = filename.replace(/\.[^.]+$/, "");
  return `${basename || "image"}.${extension}`;
}
