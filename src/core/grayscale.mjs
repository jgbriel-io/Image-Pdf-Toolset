import sharp from "sharp";

/**
 * Converte uma imagem para escala de cinza.
 * @param {Buffer} buffer
 */
export async function grayscale(buffer) {
  const { data, info } = await sharp(buffer)
    .grayscale()
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, format: info.format };
}
