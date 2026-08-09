import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter: none
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function roundedRectDistance(px, py, half, radius) {
  const qx = Math.abs(px) - half + radius;
  const qy = Math.abs(py) - half + radius;
  return (
    Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - radius
  );
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

const TOP = [0x10, 0xb9, 0x81]; // emerald-500
const BOTTOM = [0x06, 0x4e, 0x3b]; // emerald-900
const FRAME = [0xff, 0xff, 0xff];

/**
 * Renders the Bismillah Bazaar app icon: a soft vertical emerald
 * gradient inside a rounded square, framed by a thin white ring.
 */
function renderIcon(size, maskable = false) {
  const center = size / 2;
  const outerHalf = size / 2;
  const outerRadius = maskable ? size / 2 : size * 0.22;
  const inset = size * 0.1;
  const innerHalf = outerHalf - inset;
  const innerRadius = Math.max(outerRadius - inset, size * 0.1);

  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const px = x - center + 0.5;
      const py = y - center + 0.5;

      const outerDist = roundedRectDistance(px, py, outerHalf, outerRadius);
      const innerDist = roundedRectDistance(px, py, innerHalf, innerRadius);
      const outerAlpha = clamp(0.5 - outerDist, 0, 1);
      const frameAlpha = clamp(0.5 - innerDist, 0, 1);

      const gradient = (1 - y / size);
      const r = lerp(TOP[0], BOTTOM[0], gradient);
      const g = lerp(TOP[1], BOTTOM[1], gradient);
      const b = lerp(TOP[2], BOTTOM[2], gradient);

      const pixel = [
        lerp(r, FRAME[0], frameAlpha),
        lerp(g, FRAME[1], frameAlpha),
        lerp(b, FRAME[2], frameAlpha),
        outerAlpha * 255,
      ];

      const offset = (y * size + x) * 4;
      rgba[offset] = pixel[0];
      rgba[offset + 1] = pixel[1];
      rgba[offset + 2] = pixel[2];
      rgba[offset + 3] = pixel[3];
    }
  }
  return encodePng(size, size, rgba);
}

const targets = [
  { size: 192, path: join(root, "public", "icons", "icon-192x192.png"), maskable: false },
  { size: 512, path: join(root, "public", "icons", "icon-512x512.png"), maskable: false },
  { size: 512, path: join(root, "public", "icons", "icon-maskable-512x512.png"), maskable: true },
  { size: 180, path: join(root, "public", "icons", "apple-touch-icon.png"), maskable: false },
  { size: 512, path: join(root, "src", "app", "icon.png"), maskable: false },
  { size: 180, path: join(root, "src", "app", "apple-icon.png"), maskable: false },
];

for (const target of targets) {
  mkdirSync(dirname(target.path), { recursive: true });
  writeFileSync(target.path, renderIcon(target.size, target.maskable));
  console.log(`Generated ${target.path}`);
}
