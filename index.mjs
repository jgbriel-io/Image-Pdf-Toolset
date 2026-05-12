#!/usr/bin/env node
/**
 * image-tools CLI
 * Uso: node index.mjs <comando> <diretório> [opções]
 *
 * Comandos:
 *   compress <dir>   Converte PNG/JPG → WebP/AVIF
 *   blur <dir>       Gera base64 blur placeholder para cada imagem
 *   report <dir>     Lista imagens com tamanhos e potencial de economia
 */

import { compressDir } from "./src/cli/compress.mjs";
import { blurDir } from "./src/cli/blur.mjs";
import { reportDir } from "./src/cli/report.mjs";

const [,, command, dir, ...flags] = process.argv;

const COMMANDS = { compress: compressDir, blur: blurDir, report: reportDir };

if (!command || !COMMANDS[command]) {
  console.log(`
image-tools — otimizador de imagens

Uso: node index.mjs <comando> <diretório> [opções]

Comandos:
  compress <dir>            PNG/JPG → WebP (padrão) ou AVIF
    --format=avif           Converte para AVIF em vez de WebP
    --quality=82            Qualidade (1-100, padrão: 82)
    --width=1920            Largura máxima (padrão: 1920)
    --update-content=<dir>  Atualiza paths nos .ts do diretório informado
    --delete-originals      Deleta os originais após converter

  blur <dir>                Gera base64 blur placeholder
    --output=<arquivo>      Salva resultado em JSON (padrão: blur-map.json)

  report <dir>              Relatório de tamanhos e economia estimada
  `);
  process.exit(0);
}

// Parseia flags --key=value ou --flag
const options = Object.fromEntries(
  flags.map((f) => {
    const [key, val] = f.replace(/^--/, "").split("=");
    return [key, val ?? true];
  })
);

if (!dir) {
  console.error(`Erro: informe o diretório. Ex: node index.mjs ${command} ./public/projects`);
  process.exit(1);
}

await COMMANDS[command](dir, options);
