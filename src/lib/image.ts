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

// Meals store only the photo's file name. iOS can move the app's container on update,
// so absolute paths saved earlier would stop resolving.
export function mealPhotoUri(fileName: string): string {
  return new File(mealPhotosDirectory, fileName).uri;
}

/** Copies a photo out of the cache into durable storage and returns its file name. */
export async function persistMealPhoto(sourceUri: string, id: string): Promise<string> {
  if (!mealPhotosDirectory.exists) {
    mealPhotosDirectory.create({ intermediates: true, idempotent: true });
  }
  const fileName = `${id}.jpg`;
  await new File(sourceUri).copy(new File(mealPhotosDirectory, fileName));
  return fileName;
}

/** Downloads a product photo (for example from Open Food Facts) into storage and returns its file name. */
export async function downloadMealPhoto(url: string, id: string): Promise<string> {
  if (!mealPhotosDirectory.exists) {
    mealPhotosDirectory.create({ intermediates: true, idempotent: true });
  }
  const fileName = `${id}.jpg`;
  await File.downloadFileAsync(url, new File(mealPhotosDirectory, fileName), { idempotent: true });
  return fileName;
}

export function deleteMealPhoto(fileName: string): void {
  const file = new File(mealPhotosDirectory, fileName);
  if (file.exists) {
    file.delete();
  }
}

/** Removes photos that no saved meal points to, for example after an interrupted save. */
export function deleteOrphanedMealPhotos(keepFileNames: Set<string>): void {
  if (!mealPhotosDirectory.exists) return;
  for (const entry of mealPhotosDirectory.list()) {
    if (entry instanceof File && !keepFileNames.has(entry.name)) {
      entry.delete();
    }
  }
}
