// Client-side downscale to keep IndexedDB lean + keep Tesseract fast.
// ponytail: global canvas; fine for single-user app. PNG-ish to JPEG q0.85.
const MAX_EDGE = 1600;

export interface DecodedImage {
  blob: Blob;
  width: number;
  height: number;
}

export async function downscaleImage(
  input: Blob,
  maxEdge = MAX_EDGE,
  quality = 0.85,
): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(input);
  const { width: w, height: h } = bitmap;
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const tw = Math.round(w * scale);
  const th = Math.round(h * scale);

  const canvas = document.createElement('canvas');
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    // ponytail: no 2d context -> return original as-is; OCR will still try.
    return { blob: input, width: w, height: h };
  }
  ctx.drawImage(bitmap, 0, 0, tw, th);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', quality),
  );
  if (!blob) return { blob: input, width: w, height: h };
  return { blob, width: tw, height: th };
}
