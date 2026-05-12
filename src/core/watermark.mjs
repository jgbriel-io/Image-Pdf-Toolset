import sharp from "sharp";

/**
 * Adiciona watermark de texto sobre a imagem.
 * @param {Buffer} buffer
 * @param {{ text?: string, opacity?: number, position?: string }} options
 * position: top-left | top-right | bottom-left | bottom-right | center
 */
export async function watermark(buffer, options = {}) {
  const text = options.text ?? "watermark";
  const opacity = Math.min(1, Math.max(0, Number(options.opacity ?? 0.5)));
  const position = options.position ?? "bottom-right";

  const meta = await sharp(buffer).metadata();
  const fontSize = Math.max(16, Math.round((meta.width ?? 800) * 0.04));

  const gravity = {
    "top-left": "northwest", "top-right": "northeast",
    "bottom-left": "southwest", "bottom-right": "southeast",
    "center": "center",
  }[position] ?? "southeast";

  const svg = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${meta.width}" height="${meta.height}">
      <style>text { font-family: sans-serif; font-size: ${fontSize}px; fill: white; fill-opacity: ${opacity}; paint-order: stroke; stroke: black; stroke-width: 2px; stroke-opacity: ${opacity * 0.5}; }</style>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle">${text}</text>
    </svg>`);

  // Renderiza o SVG e compõe sobre a imagem original
  const overlay = await sharp(svg).png().toBuffer();

  const { data, info } = await sharp(buffer)
    .composite([{ input: overlay, gravity }])
    .toBuffer({ resolveWithObject: true });

  return { buffer: data, format: info.format };
}
