import sharp from "sharp";

/**
 * Gera metadados de um buffer de imagem.
 * @param {Buffer} buffer
 * @param {{ filename?: string, size?: number }} info
 */
export async function report(buffer, { filename = "unknown", size = buffer.length } = {}) {
  const meta = await sharp(buffer).metadata();
  const estimated = size * 0.15;
  return {
    filename,
    size,
    width: meta.width,
    height: meta.height,
    format: meta.format,
    estimatedWebp: Math.round(estimated),
  };
}
