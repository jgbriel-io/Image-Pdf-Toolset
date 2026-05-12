import { readdir, readFile, writeFile } from "fs/promises";
import { join, extname, basename, relative } from "path";
import { blur } from "../core/blur.mjs";

const SUPPORTED = [".png", ".jpg", ".jpeg", ".webp", ".avif"];

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

export async function blurDir(dir, options = {}) {
  const outputFile = options.output ?? "blur-map.json";
  const files = await getFiles(dir);
  const images = files.filter((f) => SUPPORTED.includes(extname(f).toLowerCase()));

  if (images.length === 0) { console.log("Nenhuma imagem encontrada."); return; }

  console.log(`\nGerando blur placeholders para ${images.length} imagens...\n`);

  const blurMap = {};
  await Promise.all(images.map(async (file) => {
    const key = "/" + relative(process.cwd(), file).replace(/\\/g, "/");
    blurMap[key] = await blur(await readFile(file));
    console.log(`✓ ${basename(file)}`);
  }));

  await writeFile(outputFile, JSON.stringify(blurMap, null, 2), "utf-8");
  console.log(`\nSalvo em ${outputFile} (${images.length} entradas)`);
}
