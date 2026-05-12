import { PDFDocument } from "pdf-lib";

/**
 * Junta múltiplos PDFs em um único arquivo.
 * @param {Buffer[]} buffers
 * @returns {Buffer}
 */
export async function pdfMerge(buffers) {
  const merged = await PDFDocument.create();

  for (const buf of buffers) {
    const doc = await PDFDocument.load(buf);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }

  return Buffer.from(await merged.save());
}
