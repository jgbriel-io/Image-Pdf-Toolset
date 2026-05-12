import sharp from "sharp";

/**
 * Redimensiona/corta uma imagem.
 * @param {Buffer} buffer
 * @param {{ width?: number, height?: number, fit?: string }} options
 * fit: cover | contain | fill | inside | outside
 */
export async function resize(buffer, options = {}) {
  const width = options.width ? Number(options.width) : undefined;
  const height = options.height ? Number(options.height) : undefined;
  const fit = options.fit ?? "inside";

  if (!width && !height) throw new Error("Informe width e/ou height.");

  const { data, info } = await sharp(buffer)
    .resize({ width, height, fit, withoutEnlargement: true })
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, format: info.format };
}
