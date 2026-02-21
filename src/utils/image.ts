import sharp from "sharp";

/**
 * Compress an image buffer to a max dimension (preserving aspect ratio)
 * and return a base64-encoded JPEG string suitable for GPT Vision.
 */
export async function compressImageForGPT(
  buffer: Buffer,
  maxDimension: number = 1024
): Promise<string> {
  const compressed = await sharp(buffer)
    .resize(maxDimension, maxDimension, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .jpeg({ quality: 85 })
    .toBuffer();

  return compressed.toString("base64");
}
