import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/** Long edge in pixels. Large enough for food recognition, small enough to keep requests fast and cheap. */
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.7;

export type PreparedImage = {
  uri: string;
  base64: string;
  mimeType: 'image/jpeg';
  width: number;
  height: number;
};

/** Downscales and re-encodes a photo to a JPEG suitable for sending to a vision model. */
export async function prepareImageForAnalysis(
  uri: string,
  size: { width: number; height: number },
): Promise<PreparedImage> {
  const context = ImageManipulator.manipulate(uri);
  if (Math.max(size.width, size.height) > MAX_DIMENSION) {
    context.resize(
      size.width >= size.height ? { width: MAX_DIMENSION, height: null } : { width: null, height: MAX_DIMENSION },
    );
  }

  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });
  context.release();
  rendered.release();

  if (!result.base64) {
    throw new Error('Could not encode the photo.');
  }

  return {
    uri: result.uri,
    base64: result.base64,
    mimeType: 'image/jpeg',
    width: result.width,
    height: result.height,
  };
}

const mealPhotosDirectory = new Directory(Paths.document, 'meal-photos');

/** Copies a photo out of the cache into durable storage so it survives for the meal history. */
export async function persistMealPhoto(sourceUri: string, id: string): Promise<string> {
  if (!mealPhotosDirectory.exists) {
    mealPhotosDirectory.create({ intermediates: true, idempotent: true });
  }
  const destination = new File(mealPhotosDirectory, `${id}.jpg`);
  await new File(sourceUri).copy(destination);
  return destination.uri;
}

export function deleteMealPhoto(uri: string): void {
  const file = new File(uri);
  if (file.exists) {
    file.delete();
  }
}
