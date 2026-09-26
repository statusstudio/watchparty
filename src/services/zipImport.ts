/**
 * ZIP Archive Importer Utility
 * Reads .zip files using JSZip, extracts image files (PNG, JPG, JPEG, WEBP, GIF),
 * sorts them naturally by filename, and returns data URLs.
 */

import JSZip from 'jszip';

export interface ExtractedImageFile {
  name: string;
  dataUrl: string;
  sizeBytes: number;
}

/**
 * Natural sort helper for filenames (e.g. 01.png, 02.png ... 10.png)
 */
function naturalCompare(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export async function extractImagesFromZip(
  zipFile: File | Blob,
  onProgress?: (loaded: number, total: number, currentName: string) => void
): Promise<ExtractedImageFile[]> {
  const zip = await JSZip.loadAsync(zipFile);
  const imageEntries: Array<{ name: string; file: JSZip.JSZipObject }> = [];

  // Filter out directories and non-image files
  zip.forEach((relativePath, zipEntry) => {
    // Ignore macOS __MACOSX metadata folders and thumbs.db
    if (
      !zipEntry.dir &&
      !relativePath.startsWith('__MACOSX') &&
      !relativePath.includes('/.') &&
      /\.(png|jpe?g|webp|gif|bmp)$/i.test(zipEntry.name)
    ) {
      imageEntries.push({ name: relativePath, file: zipEntry });
    }
  });

  // Sort files naturally by filename so 01.png, 02.png, ... stay in exact order
  imageEntries.sort((a, b) => naturalCompare(a.name, b.name));

  const total = imageEntries.length;
  const results: ExtractedImageFile[] = [];

  for (let i = 0; i < total; i++) {
    const entry = imageEntries[i];
    if (onProgress) {
      onProgress(i + 1, total, entry.name);
    }

    const blob = await entry.file.async('blob');
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    results.push({
      name: entry.name.split('/').pop() || entry.name,
      dataUrl,
      sizeBytes: blob.size,
    });
  }

  return results;
}
