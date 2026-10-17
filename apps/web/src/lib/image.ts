import type { SupportedImageMimeType } from '@rekasains/shared-types';

export interface PreparedImage {
  dataUrl: string;
  mimeType: SupportedImageMimeType;
}

const MAX_EDGE_PX = 1280;
const JPEG_QUALITY = 0.82;

function drawToJpeg(source: CanvasImageSource, width: number, height: number): PreparedImage {
  const scale = Math.min(1, MAX_EDGE_PX / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas tidak tersedia di browser ini.');
  }
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { dataUrl: canvas.toDataURL('image/jpeg', JPEG_QUALITY), mimeType: 'image/jpeg' };
}

/** Reads an image file and downscales it to a JPEG of at most 1280px on its longest edge. */
export async function prepareImageFile(file: File): Promise<PreparedImage> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = objectUrl;
    await img.decode();
    return drawToJpeg(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/** Captures the current frame of a playing video element as a downscaled JPEG. */
export function captureVideoFrame(video: HTMLVideoElement): PreparedImage {
  return drawToJpeg(video, video.videoWidth || 640, video.videoHeight || 480);
}
