import { PDFDocument } from "pdf-lib";

/**
 * Extrai páginas específicas de um PDF.
 * @param {Buffer} buffer
 * @param {number[]} pages - números de página (1-based)
 * @returns {Buffer}
 */
export async function pdfExtract(buffer, pages) {
  const src = await PDFDocument.load(buffer);
  const total = src.getPageCount();
  const indices = pages
    .map((p) => p - 1)
    .filter((i) => i >= 0 && i < total);

  if (indices.length === 0) throw new Error("Nenhuma página válida informada.");

  const doc = await PDFDocument.create();
  const copied = await doc.copyPages(src, indices);
  copied.forEach((p) => doc.addPage(p));

  return Buffer.from(await doc.save());
}
