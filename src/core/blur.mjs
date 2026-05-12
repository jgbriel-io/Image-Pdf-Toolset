import sharp from "sharp";

/**
 * Gera um base64 blur placeholder a partir de um buffer de imagem.
 * @param {Buffer} buffer
 * @returns {string} data URL base64
 */
export async function blur(buffer) {
  const { data, info } = await sharp(buffer)
    .resize(10, 10, { fit: "inside" })
    .blur(2)
    .toBuffer({ resolveWithObject: true });

  return `data:image/${info.format};base64,${data.toString("base64")}`;
}
