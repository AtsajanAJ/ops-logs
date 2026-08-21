import sharp from "sharp";

function makeSvg(size, { maskable = false } = {}) {
  const pad = size * 0.18;
  const inner = size - pad * 2;
  const cy = size / 2;
  const stroke = Math.max(size * 0.055, 8);
  const left = pad + inner * 0.08;
  const right = size - pad - inner * 0.08;
  const midY = cy;
  const pathD = [
    "M",
    left,
    midY,
    "L",
    left + inner * 0.22,
    midY,
    "L",
    left + inner * 0.34,
    midY - inner * 0.28,
    "L",
    left + inner * 0.5,
    midY + inner * 0.32,
    "L",
    left + inner * 0.66,
    midY - inner * 0.12,
    "L",
    right - inner * 0.08,
    midY,
    "L",
    right,
    midY,
  ].join(" ");
  const radius = maskable ? size * 0.12 : size * 0.22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#020617"/>
  <path d="${pathD}" fill="none" stroke="#ffffff" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
}

async function writePng(file, size, opts) {
  const svg = Buffer.from(makeSvg(size, opts));
  await sharp(svg).png().toFile(file);
  console.log("wrote", file, size);
}

async function main() {
  await writePng("public/icons/icon-192.png", 192);
  await writePng("public/icons/icon-512.png", 512);
  await writePng("public/icons/maskable-512.png", 512, { maskable: true });
  await writePng("public/icons/apple-touch-icon.png", 180);
  await writePng("public/favicon-32.png", 32);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
