# Image & PDF Toolset

A local toolkit for processing images and PDFs — available as both a **CLI** and a **web UI**.

## Features

### 🖼 Image
| Operation | Description |
|-----------|-------------|
| `compress` | Convert PNG/JPG → WebP or AVIF |
| `resize` | Resize with fit modes (inside, cover/crop, contain, fill) |
| `rotate` | Rotate by angle or auto-orient via EXIF |
| `grayscale` | Convert to black & white |
| `watermark` | Overlay text with configurable position and opacity |
| `strip-metadata` | Remove EXIF/GPS/ICC data |
| `blur` | Generate base64 blur placeholders for `next/image` |
| `report` | Analyze image sizes, dimensions and WebP savings estimate |

### 📄 PDF
| Operation | Description |
|-----------|-------------|
| `pdf-merge` | Merge multiple PDFs into one |
| `pdf-split` | Split a PDF into one file per page (ZIP) |
| `pdf-extract` | Extract specific pages into a new PDF |
| `img-to-pdf` | Convert one or more images into a PDF |
| `pdf-to-img` | Render PDF pages as PNG images (ZIP) |

## Setup

```bash
npm install
```

## Web UI

```bash
npm start
# → http://localhost:3000
```

Upload a file, pick an operation, download the result.

## CLI

```bash
node index.mjs <command> <dir> [options]
```

### compress

```bash
node index.mjs compress ./public/images
node index.mjs compress ./public/images --format=avif --quality=75
node index.mjs compress ./public/images --update-content=./src/content --delete-originals
```

| Option | Default | Description |
|--------|---------|-------------|
| `--format=webp\|avif` | `webp` | Output format |
| `--quality=N` | `82` | Quality (1–100) |
| `--width=N` | `1920` | Max width (preserves ratio) |
| `--update-content=<dir>` | — | Update `.png→.webp` paths in `.ts` files |
| `--delete-originals` | — | Delete originals after converting |

### blur

```bash
node index.mjs blur ./public/images
node index.mjs blur ./public/images --output=blur-map.json
```

Generates a `blur-map.json` for use with `next/image`:

```tsx
import blurMap from "@/blur-map.json";

<Image
  src="/images/banner.webp"
  blurDataURL={blurMap["/images/banner.webp"]}
  placeholder="blur"
/>
```

### report

```bash
node index.mjs report ./public/images
```

Lists all images with size, dimensions, and estimated WebP savings. Warns on files above 500KB.

## Stack

- **[sharp](https://sharp.pixelplumbing.com/)** — image processing
- **[pdf-lib](https://pdf-lib.js.org/)** — PDF manipulation
- **[pdfjs-dist](https://github.com/mozilla/pdf.js)** + **[@napi-rs/canvas](https://github.com/Brooooooklyn/canvas)** — PDF rendering to image (no native binaries required)
- **Express** + **Multer** — web server
- **JSZip** — ZIP output for multi-file results

## Project Structure

```
src/
├── core/   # Pure functions (buffer → buffer), shared by CLI and web
├── cli/    # Directory adapters for CLI usage
└── web/    # Express routes
public/
└── index.html
index.mjs   # CLI entry point
server.mjs  # Web entry point
```
