import { readdir, stat, readFile } from "fs/promises";
import { join, extname, relative } from "path";
import { report } from "../core/report.mjs";

const SUPPORTED = [".png", ".jpg", ".jpeg", ".webp", ".avif"];
const WARN_KB = 500;

async function getFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((e) => {
      const full = join(dir, e.name);
      return e.isDirectory() ? getFiles(full) : full;
    })
  );
  return files.flat();
}

function fmt(bytes) {
  return bytes >= 1e6 ? `${(bytes / 1e6).toFixed(2)}MB` : `${(bytes / 1e3).toFixed(0)}KB`;
}

export async function reportDir(dir) {
  const files = await getFiles(dir);
  const images = files.filter((f) => SUPPORTED.includes(extname(f).toLowerCase()));

  if (images.length === 0) { console.log("Nenhuma imagem encontrada."); return; }

  console.log(`\nRelatório de imagens — ${dir}\n`);
  console.log(`${"Arquivo".padEnd(60)} ${"Tamanho".padStart(10)} ${"Dimensões".padStart(16)}`);
  console.log("─".repeat(90));

  const rows = await Promise.all(images.map(async (file) => {
    const size = (await stat(file)).size;
    const buffer = await readFile(file);
    const data = await report(buffer, { filename: relative(dir, file), size });
    return { ...data, file };
  }));

  rows.sort((a, b) => b.size - a.size);

  let total = 0, warnings = 0;
  for (const { filename, size, width, height, format } of rows) {
    const warn = size > WARN_KB * 1000 ? " ⚠️" : "";
    if (warn) warnings++;
    total += size;
    const dims = width && height ? `${width}×${height}` : "—";
    console.log(`${filename.replace(/\\/g, "/").padEnd(60)} ${fmt(size).padStart(10)} ${dims.padStart(16)}${warn}`);
  }

  console.log("─".repeat(90));
  console.log(`Total: ${images.length} imagens | ${fmt(total)}`);
  if (warnings > 0) console.log(`\n⚠️  ${warnings} imagens acima de ${WARN_KB}KB — considere comprimir.`);

  const pngs = rows.filter((r) => [".png", ".jpg", ".jpeg"].includes(extname(r.file).toLowerCase()));
  if (pngs.length > 0) {
    const totalPng = pngs.reduce((s, r) => s + r.size, 0);
    console.log(`\nEstimativa WebP: ${fmt(totalPng)} → ~${fmt(totalPng * 0.15)} (economia de ~85%)`);
  }
}
