interface ResizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeBytes?: number;
  quality?: number;
  outputType?: "image/jpeg" | "image/webp" | "image/png";
}

export async function resizeImageFile(file: File, options: ResizeOptions = {}): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    maxSizeBytes = 700 * 1024,
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

  const blob = await compressCanvas(canvas, {
    outputType,
    initialQuality: quality,
    maxSizeBytes,
  });

  const extension = outputType === "image/png" ? "png" : outputType === "image/jpeg" ? "jpg" : "webp";
  const filename = replaceExtension(file.name, extension);
  return new File([blob], filename, { type: outputType });
}

async function compressCanvas(
  canvas: HTMLCanvasElement,
  options: {
    outputType: "image/jpeg" | "image/webp" | "image/png";
    initialQuality: number;
    maxSizeBytes: number;
  }
) {
  let workingCanvas = canvas;
  let quality = options.initialQuality;
  let blob = await canvasToBlob(workingCanvas, options.outputType, quality);

  while (blob.size > options.maxSizeBytes && quality > 0.52 && options.outputType !== "image/png") {
    quality = Math.max(0.52, quality - 0.08);
    blob = await canvasToBlob(workingCanvas, options.outputType, quality);
  }

  while (blob.size > options.maxSizeBytes && Math.min(workingCanvas.width, workingCanvas.height) > 320) {
    workingCanvas = scaleCanvas(workingCanvas, 0.86);
    quality = options.outputType === "image/png" ? options.initialQuality : 0.68;
    blob = await canvasToBlob(workingCanvas, options.outputType, quality);
  }

  return blob;
}

function scaleCanvas(source: HTMLCanvasElement, ratio: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * ratio));
  canvas.height = Math.max(1, Math.round(source.height * ratio));

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Image compression is not supported by this browser.");
  }

  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  outputType: "image/jpeg" | "image/webp" | "image/png",
  quality: number
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("Could not resize image."));
      }
    }, outputType, quality);
  });
}

function replaceExtension(filename: string, extension: string) {
  const basename = filename.replace(/\.[^.]+$/, "");
  return `${basename || "image"}.${extension}`;
}
