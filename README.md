# image-tools

CLI standalone para otimização de imagens. Não instalar dentro de projetos Next.js — usar de fora.

## Setup

```bash
cd D:\Projetos\image-tools
npm install
```

## Comandos

### compress

Converte PNG/JPG → WebP ou AVIF.

```bash
node index.mjs compress <dir> [opções]
```

| Opção | Padrão | Descrição |
|-------|--------|-----------|
| `--format=webp\|avif` | `webp` | Formato de saída |
| `--quality=82` | `82` | Qualidade (1-100) |
| `--width=1920` | `1920` | Largura máxima (mantém proporção) |
| `--update-content=<dir>` | — | Atualiza paths `.png→.webp` nos `.ts` do diretório |
| `--delete-originals` | — | Deleta originais após converter |

**Exemplos:**

```bash
# Converte tudo em public/projects para WebP
node index.mjs compress D:\Projetos\meu-site\public\projects

# Converte + atualiza content files + deleta originais
node index.mjs compress D:\Projetos\meu-site\public\projects \
  --update-content=D:\Projetos\meu-site\src\content\projects \
  --delete-originals

# Converte para AVIF com qualidade 75
node index.mjs compress D:\Projetos\meu-site\public\projects --format=avif --quality=75
```

---

### blur

Gera base64 blur placeholders para uso com `next/image`.

```bash
node index.mjs blur <dir> [--output=blur-map.json]
```

Gera um `blur-map.json` com chave = path da imagem, valor = base64 tiny blur.

**Uso no Next.js:**
```tsx
import blurMap from "@/blur-map.json";

<Image
  src="/projects/her-ecosystem/banner.webp"
  blurDataURL={blurMap["/projects/her-ecosystem/banner.webp"]}
  placeholder="blur"
  ...
/>
```

---

### report

Lista todas as imagens com tamanho, dimensões e estimativa de economia.

```bash
node index.mjs report <dir>
```

Alerta imagens acima de 500KB e estima economia com conversão WebP.

---

## Observações

- WebP não suporta imagens maiores que 16383px — `--width=1920` previne o erro
- AVIF tem compressão melhor que WebP mas encoding mais lento
- Originais ficam intactos até usar `--delete-originals`
- Não instalar `sharp` dentro de projetos Next.js com `output: 'export'` — causa conflito com Turbopack
