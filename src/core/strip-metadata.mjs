import sharp from "sharp";

/**
 * Remove todos os metadados EXIF/ICC/XMP da imagem.
 * @param {Buffer} buffer
 */
export async function stripMetadata(buffer) {
  const { data, info } = await sharp(buffer)
    .withMetadata(false)
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, format: info.format };
}
