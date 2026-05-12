import sharp from "sharp";

const SUPPORTED = [".png", ".jpg", ".jpeg"];

/**
 * Comprime um buffer de imagem para WebP ou AVIF.
 * @param {Buffer} buffer
 * @param {{ format?: string, quality?: number, width?: number }} options
 * @returns {{ buffer: Buffer, format: string }}
 */
export async function compress(buffer, options = {}) {
  const format = options.format ?? "webp";
  const quality = Number(options.quality ?? 82);
  const maxWidth = Number(options.width ?? 1920);

  if (!["webp", "avif"].includes(format)) throw new Error(`Formato inválido: ${format}`);

  const out = await sharp(buffer)
    .resize({ width: maxWidth, withoutEnlargement: true })
    [format]({ quality })
    .toBuffer();

  return { buffer: out, format };
}

export { SUPPORTED };
