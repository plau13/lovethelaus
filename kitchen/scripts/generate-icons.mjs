/**
 * Render the app icon to PNG at the sizes iOS and Android need.
 * `src/app/icon.svg` is a stroke-only drawing with no background, which is fine
 * as a favicon but wrong for a maskable icon: the launcher crops to a circle and
 * needs opaque pixels plus a safe zone. Both variants are generated here and
 * committed, so the build needs no image tooling.
 *
 * Run with: node scripts/generate-icons.mjs
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BACKGROUND = "#faf6f0"; // paper, matching the manifest background_color

/** Maskable icons keep their artwork inside the middle 80%; 60% is comfortably safe. */
const MASKABLE_ARTWORK_RATIO = 0.6;
const ANY_ARTWORK_RATIO = 0.82;

async function render(svg, size, ratio, out) {
  const artwork = Math.round(size * ratio);
  const inset = Math.round((size - artwork) / 2);
  const scaled = await sharp(Buffer.from(svg)).resize(artwork, artwork).png().toBuffer();
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: BACKGROUND,
    },
  })
    .composite([{ input: scaled, top: inset, left: inset }])
    .png()
    .toFile(join(root, "public", out));
  console.log(`wrote public/${out} (${size}px, artwork ${artwork}px)`);
}

const svg = await readFile(join(root, "src/app/icon.svg"), "utf8");
await render(svg, 192, ANY_ARTWORK_RATIO, "icon-192.png");
await render(svg, 512, ANY_ARTWORK_RATIO, "icon-512.png");
await render(svg, 192, MASKABLE_ARTWORK_RATIO, "icon-192-maskable.png");
await render(svg, 512, MASKABLE_ARTWORK_RATIO, "icon-512-maskable.png");
