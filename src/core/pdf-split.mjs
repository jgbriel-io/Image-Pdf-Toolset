import { PDFDocument } from "pdf-lib";

/**
 * Separa cada página do PDF em um arquivo individual.
 * @param {Buffer} buffer
 * @returns {{ page: number, buffer: Buffer }[]}
 */
export async function pdfSplit(buffer) {
  const src = await PDFDocument.load(buffer);
  const results = [];

  for (let i = 0; i < src.getPageCount(); i++) {
    const doc = await PDFDocument.create();
    const [page] = await doc.copyPages(src, [i]);
    doc.addPage(page);
    results.push({ page: i + 1, buffer: Buffer.from(await doc.save()) });
  }

  return results;
}
