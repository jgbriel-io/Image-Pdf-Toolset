import { readdir, stat, readFile, writeFile, unlink } from "fs/promises";
import { join, extname, basename } from "path";
import { compress, SUPPORTED } from "../core/compress.mjs";

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

async function updateContentDir(contentDir, ext) {
  const entries = await readdir(contentDir, { withFileTypes: true });
  const tsFiles = entries.filter((e) => !e.isDirectory() && e.name.endsWith(".ts"));
  for (const file of tsFiles) {
    const path = join(contentDir, file.name);
    const original = await readFile(path, "utf-8");
    const updated = original.replace(/\.(png|jpg|jpeg)(?=")/gi, `.${ext}`);
    if (original !== updated) {
      await writeFile(path, updated, "utf-8");
      console.log(`  → paths atualizados: ${file.name}`);
    }
  }
}

export async function compressDir(dir, options = {}) {
  const deleteOriginals = options["delete-originals"] === true;
  const contentDir = options["update-content"];

  const files = await getFiles(dir);
  const images = files.filter((f) => SUPPORTED.includes(extname(f).toLowerCase()));

  if (images.length === 0) { console.log("Nenhuma imagem PNG/JPG encontrada."); return; }

  const format = options.format ?? "webp";
  console.log(`\nComprimindo ${images.length} imagens → ${format.toUpperCase()}...\n`);

  let totalBefore = 0, totalAfter = 0;

  await Promise.all(images.map(async (file) => {
    const before = (await stat(file)).size;
    const input = await readFile(file);
    const { buffer: out, format: fmt } = await compress(input, options);
    const outFile = file.replace(/\.(png|jpg|jpeg)$/i, `.${fmt}`);
    await writeFile(outFile, out);
    const after = out.length;
    const saved = (((before - after) / before) * 100).toFixed(1);
    totalBefore += before;
    totalAfter += after;
    console.log(`✓ ${basename(file)} → ${basename(outFile)} | ${(before/1e6).toFixed(2)}MB → ${(after/1e6).toFixed(2)}MB (-${saved}%)`);
    if (deleteOriginals) await unlink(file);
  }));

  const totalSaved = (((totalBefore - totalAfter) / totalBefore) * 100).toFixed(1);
  console.log(`\nTotal: ${(totalBefore/1e6).toFixed(2)}MB → ${(totalAfter/1e6).toFixed(2)}MB (-${totalSaved}%)`);
  if (deleteOriginals) console.log("Originais deletados.");
  if (contentDir) { console.log(`\nAtualizando paths em ${contentDir}...`); await updateContentDir(contentDir, format); }
  console.log("\nPronto.");
}
