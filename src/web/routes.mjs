import { Router } from "express";
import multer from "multer";
import JSZip from "jszip";
import { compress } from "../core/compress.mjs";
import { blur } from "../core/blur.mjs";
import { report } from "../core/report.mjs";
import { resize } from "../core/resize.mjs";
import { stripMetadata } from "../core/strip-metadata.mjs";
import { rotate } from "../core/rotate.mjs";
import { grayscale } from "../core/grayscale.mjs";
import { watermark } from "../core/watermark.mjs";
import { pdfMerge } from "../core/pdf-merge.mjs";
import { pdfSplit } from "../core/pdf-split.mjs";
import { pdfExtract } from "../core/pdf-extract.mjs";
import { imgToPdf } from "../core/img-to-pdf.mjs";
import { pdfToImg } from "../core/pdf-to-img.mjs";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

function sendImage(res, buffer, format, filename) {
  res.set("Content-Type", `image/${format}`);
  res.set("Content-Disposition", `attachment; filename="${filename}.${format}"`);
  res.send(buffer);
}

function sendPdf(res, buffer, filename) {
  res.set("Content-Type", "application/pdf");
  res.set("Content-Disposition", `attachment; filename="${filename}.pdf"`);
  res.send(buffer);
}

async function sendZip(res, files, filename) {
  const zip = new JSZip();
  for (const { name, buffer } of files) zip.file(name, buffer);
  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
  res.set("Content-Type", "application/zip");
  res.set("Content-Disposition", `attachment; filename="${filename}.zip"`);
  res.send(zipBuffer);
}

/**
 * Processa múltiplas imagens com uma função core.
 * 1 arquivo → resposta direta. 2+ → ZIP.
 */
async function handleImages(req, res, fn, zipName) {
  const files = req.files;
  if (!files?.length) throw new Error("No image provided.");

  const results = await Promise.all(
    files.map(async (f) => {
      const { buffer, format } = await fn(f.buffer);
      const name = f.originalname.replace(/\.[^.]+$/, `.${format}`);
      return { name, buffer, format };
    })
  );

  if (results.length === 1) {
    sendImage(res, results[0].buffer, results[0].format, zipName);
  } else {
    await sendZip(res, results, zipName);
  }
}

// ── Imagem ────────────────────────────────────────────────────────────────────

router.post("/compress", upload.array("images", 5), async (req, res) => {
  try {
    const { format = "webp", quality = "82", width = "1920" } = req.body;
    await handleImages(req, res, (buf) => compress(buf, { format, quality, width }), "compressed");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/resize", upload.array("images", 5), async (req, res) => {
  try {
    const { width, height, fit } = req.body;
    await handleImages(req, res, (buf) => resize(buf, { width, height, fit }), "resized");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/rotate", upload.array("images", 5), async (req, res) => {
  try {
    const { angle, auto } = req.body;
    await handleImages(req, res, (buf) => rotate(buf, { angle, auto: auto === "true" }), "rotated");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/grayscale", upload.array("images", 5), async (req, res) => {
  try {
    await handleImages(req, res, (buf) => grayscale(buf), "grayscale");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/watermark", upload.array("images", 5), async (req, res) => {
  try {
    const { text, opacity, position } = req.body;
    await handleImages(req, res, (buf) => watermark(buf, { text, opacity, position }), "watermarked");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/strip-metadata", upload.array("images", 5), async (req, res) => {
  try {
    await handleImages(req, res, (buf) => stripMetadata(buf), "clean");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// blur e report retornam JSON — tratamento separado
router.post("/blur", upload.single("image"), async (req, res) => {
  try {
    const blurData = await blur(req.file.buffer);
    res.json({ blur: blurData, filename: req.file.originalname });
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/report", upload.single("image"), async (req, res) => {
  try {
    const data = await report(req.file.buffer, { filename: req.file.originalname, size: req.file.size });
    res.json(data);
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── PDF ───────────────────────────────────────────────────────────────────────

router.post("/pdf-merge", upload.array("pdfs"), async (req, res) => {
  try {
    if (!req.files?.length) throw new Error("Send at least one PDF.");
    const result = await pdfMerge(req.files.map((f) => f.buffer));
    sendPdf(res, result, "merged");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/pdf-split", upload.single("pdf"), async (req, res) => {
  try {
    const pages = await pdfSplit(req.file.buffer);
    await sendZip(res, pages.map((p) => ({ name: `page-${p.page}.pdf`, buffer: p.buffer })), "split");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/pdf-extract", upload.single("pdf"), async (req, res) => {
  try {
    const pages = String(req.body.pages ?? "").split(",").map(Number).filter(Boolean);
    if (!pages.length) throw new Error("Specify pages (e.g. 1,3,5).");
    const result = await pdfExtract(req.file.buffer, pages);
    sendPdf(res, result, "extracted");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/img-to-pdf", upload.array("images"), async (req, res) => {
  try {
    if (!req.files?.length) throw new Error("Send at least one image.");
    const result = await imgToPdf(req.files.map((f) => f.buffer));
    sendPdf(res, result, "document");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/pdf-to-img", upload.single("pdf"), async (req, res) => {
  try {
    const pages = req.body.pages
      ? String(req.body.pages).split(",").map(Number).filter(Boolean)
      : undefined;
    const imgs = await pdfToImg(req.file.buffer, { pages, scale: req.body.scale });
    await sendZip(res, imgs.map((p) => ({ name: `page-${p.page}.png`, buffer: p.buffer })), "pages");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

export default router;
