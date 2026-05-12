import sharp from "sharp";

/**
 * Rotaciona uma imagem.
 * @param {Buffer} buffer
 * @param {{ angle?: number, auto?: boolean }} options
 * angle: graus (0, 90, 180, 270). auto: usa orientação EXIF.
 */
export async function rotate(buffer, options = {}) {
  const angle = options.auto ? undefined : Number(options.angle ?? 90);

  const { data, info } = await sharp(buffer)
    .rotate(angle)
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, format: info.format };
}
