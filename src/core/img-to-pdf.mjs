import { PDFDocument } from "pdf-lib";
import sharp from "sharp";

/**
 * Converte uma ou mais imagens em um PDF (uma imagem por página).
 * @param {Buffer[]} buffers
 * @returns {Buffer}
 */
export async function imgToPdf(buffers) {
  const doc = await PDFDocument.create();

  for (const buf of buffers) {
    const meta = await sharp(buf).metadata();

    // Converte para PNG para garantir compatibilidade com pdf-lib
    const png = await sharp(buf).png().toBuffer();
    const img = await doc.embedPng(png);

    const page = doc.addPage([meta.width, meta.height]);
    page.drawImage(img, { x: 0, y: 0, width: meta.width, height: meta.height });
  }

  return Buffer.from(await doc.save());
}
