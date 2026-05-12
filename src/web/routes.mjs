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

// ── Imagem ────────────────────────────────────────────────────────────────────

router.post("/compress", upload.single("image"), async (req, res) => {
  try {
    const { format = "webp", quality = "82", width = "1920" } = req.body;
    const { buffer, format: fmt } = await compress(req.file.buffer, { format, quality, width });
    sendImage(res, buffer, fmt, "compressed");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

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

router.post("/resize", upload.single("image"), async (req, res) => {
  try {
    const { width, height, fit } = req.body;
    const { buffer, format } = await resize(req.file.buffer, { width, height, fit });
    sendImage(res, buffer, format, "resized");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/strip-metadata", upload.single("image"), async (req, res) => {
  try {
    const { buffer, format } = await stripMetadata(req.file.buffer);
    sendImage(res, buffer, format, "clean");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/rotate", upload.single("image"), async (req, res) => {
  try {
    const { angle, auto } = req.body;
    const { buffer, format } = await rotate(req.file.buffer, { angle, auto: auto === "true" });
    sendImage(res, buffer, format, "rotated");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/grayscale", upload.single("image"), async (req, res) => {
  try {
    const { buffer, format } = await grayscale(req.file.buffer);
    sendImage(res, buffer, format, "grayscale");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

router.post("/watermark", upload.single("image"), async (req, res) => {
  try {
    const { text, opacity, position } = req.body;
    const { buffer, format } = await watermark(req.file.buffer, { text, opacity, position });
    sendImage(res, buffer, format, "watermarked");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// ── PDF ───────────────────────────────────────────────────────────────────────

// Merge: múltiplos PDFs → um PDF
router.post("/pdf-merge", upload.array("pdfs"), async (req, res) => {
  try {
    if (!req.files?.length) throw new Error("Envie ao menos um PDF.");
    const buffers = req.files.map((f) => f.buffer);
    const result = await pdfMerge(buffers);
    sendPdf(res, result, "merged");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Split: um PDF → ZIP com uma página por arquivo
router.post("/pdf-split", upload.single("pdf"), async (req, res) => {
  try {
    const pages = await pdfSplit(req.file.buffer);
    await sendZip(res, pages.map((p) => ({ name: `page-${p.page}.pdf`, buffer: p.buffer })), "split");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Extract: páginas específicas → PDF
router.post("/pdf-extract", upload.single("pdf"), async (req, res) => {
  try {
    const pages = String(req.body.pages ?? "").split(",").map(Number).filter(Boolean);
    if (!pages.length) throw new Error("Informe as páginas (ex: 1,3,5).");
    const result = await pdfExtract(req.file.buffer, pages);
    sendPdf(res, result, "extracted");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// Img → PDF: uma ou mais imagens → PDF
router.post("/img-to-pdf", upload.array("images"), async (req, res) => {
  try {
    if (!req.files?.length) throw new Error("Envie ao menos uma imagem.");
    const buffers = req.files.map((f) => f.buffer);
    const result = await imgToPdf(buffers);
    sendPdf(res, result, "document");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

// PDF → Img: páginas do PDF → ZIP com PNGs
router.post("/pdf-to-img", upload.single("pdf"), async (req, res) => {
  try {
    const pages = req.body.pages
      ? String(req.body.pages).split(",").map(Number).filter(Boolean)
      : undefined;
    const scale = req.body.scale;
    const imgs = await pdfToImg(req.file.buffer, { pages, scale });
    await sendZip(res, imgs.map((p) => ({ name: `page-${p.page}.png`, buffer: p.buffer })), "pages");
  } catch (e) { res.status(400).json({ error: e.message }); }
});

export default router;
