import { createCanvas } from "@napi-rs/canvas";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";

/**
 * Converte páginas de um PDF em imagens PNG.
 * @param {Buffer} buffer
 * @param {{ scale?: number, pages?: number[] }} options
 * pages: lista 1-based de páginas a converter (padrão: todas)
 * @returns {{ page: number, buffer: Buffer }[]}
 */
export async function pdfToImg(buffer, options = {}) {
  const scale = Number(options.scale ?? 2);

  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const total = doc.numPages;

  const pageNums = options.pages?.length
    ? options.pages.filter((p) => p >= 1 && p <= total)
    : Array.from({ length: total }, (_, i) => i + 1);

  const results = [];

  for (const pageNum of pageNums) {
    const page = await doc.getPage(pageNum);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d");

    await page.render({ canvasContext: ctx, viewport }).promise;

    results.push({ page: pageNum, buffer: canvas.toBuffer("image/png") });
  }

  return results;
}
