/** Longest side sent to the model: small enough to upload fast, big enough to read a receipt. */
const MAX_SIDE = 1600;

async function decode(file: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      // Phone photos carry their rotation in EXIF; without this a receipt can arrive sideways.
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      // Fall through to the <img> route, which some browsers decode more formats with.
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * A photo straight off a phone is often 4–12 MB. Shrunk to JPEG at most 1600px
 * on its longest side it is a few hundred KB, which uploads in a moment on
 * hotel Wi-Fi and uses far less of the free Gemini quota.
 */
export async function prepareReceiptImage(file: Blob): Promise<{ base64: string; mimeType: string }> {
  const source = await decode(file);
  const width = 'naturalWidth' in source ? source.naturalWidth : source.width;
  const height = 'naturalHeight' in source ? source.naturalHeight : source.height;
  const scale = Math.min(1, MAX_SIDE / Math.max(width, height));

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas unavailable');
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ('close' in source) source.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
  if (!blob) throw new Error('Could not encode image');
  return { base64: await toBase64(blob), mimeType: 'image/jpeg' };
}
