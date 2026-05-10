// 把 public/icons/*.svg 轉成 PWA 需要的 PNG
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "..");
const iconsDir = path.join(root, "public", "icons");

async function render(svgName, outName, size, opts = {}) {
  const svg = await readFile(path.join(iconsDir, svgName));
  const pipe = sharp(svg, { density: 384 }).resize(size, size, {
    fit: "contain",
    background: opts.background ?? { r: 0, g: 0, b: 0, alpha: 0 },
  });
  const png = await pipe.png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path.join(iconsDir, outName), png);
  console.log(`wrote ${outName} (${png.length} bytes)`);
}

await render("icon.svg", "icon-192.png", 192);
await render("icon.svg", "icon-512.png", 512);
await render("icon-maskable.svg", "icon-maskable-512.png", 512);
await render("apple-touch-icon.svg", "apple-touch-icon.png", 180, {
  background: { r: 253, g: 243, b: 240, alpha: 1 },
});
