// 외부 라이브러리 없이 앱 아이콘 PNG 생성 (새이파리 = 새 잎)
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const SIZE = 512;
const buf = Buffer.alloc(SIZE * SIZE * 4); // RGBA

function px(x, y, r, g, b, a = 255) {
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
  const i = (y * SIZE + x) * 4;
  // simple alpha over
  const sa = a / 255;
  buf[i] = Math.round(buf[i] * (1 - sa) + r * sa);
  buf[i + 1] = Math.round(buf[i + 1] * (1 - sa) + g * sa);
  buf[i + 2] = Math.round(buf[i + 2] * (1 - sa) + b * sa);
  buf[i + 3] = Math.max(buf[i + 3], a);
}

function roundedRectMask(x, y, rx, ry, w, h, radius) {
  // inside rounded rect?
  if (x < rx || y < ry || x >= rx + w || y >= ry + h) return false;
  const dx = Math.min(x - rx, rx + w - 1 - x);
  const dy = Math.min(y - ry, ry + h - 1 - y);
  if (dx >= radius || dy >= radius) return true;
  const cxp = dx < radius ? rx + radius : rx + w - radius;
  const cyp = dy < radius ? ry + radius : ry + h - radius;
  return Math.hypot(x - cxp, y - cyp) <= radius;
}

function ellipse(cx, cy, rx, ry, color) {
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
    for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const v = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (v <= 1) {
        // soft edge
        const a = v > 0.9 ? Math.round(255 * (1 - (v - 0.9) / 0.1)) : 255;
        px(x, y, color[0], color[1], color[2], a);
      }
    }
  }
}

const GREEN_BG = [30, 69, 48];      // #1E4530
const BEIGE = [234, 226, 208];      // #EAE2D0
const LEAF = [58, 122, 82];         // #3A7A52

// 1) rounded green background (transparent corners)
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    if (roundedRectMask(x, y, 0, 0, SIZE, SIZE, 96)) {
      const i = (y * SIZE + x) * 4;
      buf[i] = GREEN_BG[0]; buf[i + 1] = GREEN_BG[1]; buf[i + 2] = GREEN_BG[2]; buf[i + 3] = 255;
    }
  }
}

// 2) stem
for (let y = 250; y < 410; y++) {
  for (let x = 246; x < 266; x++) px(x, y, BEIGE[0], BEIGE[1], BEIGE[2], 255);
}

// 3) two sprout leaves
ellipse(196, 250, 96, 52, LEAF);
ellipse(316, 224, 96, 52, BEIGE);

// --- encode PNG ---
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.concat([tb, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcBuf) >>> 0, 0);
  return Buffer.concat([len, tb, data, crc]);
}

const CRC_TABLE = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(SIZE, 0);
ihdr.writeUInt32BE(SIZE, 4);
ihdr[8] = 8;   // bit depth
ihdr[9] = 6;   // color type RGBA
ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (let y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // filter none
  buf.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
}
const idat = zlib.deflateSync(raw, { level: 9 });

const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk('IHDR', ihdr),
  chunk('IDAT', idat),
  chunk('IEND', Buffer.alloc(0)),
]);

// build/ : electron-builder 설치 아이콘 / assets/ : 실행 중 창 아이콘(asar에 포함)
for (const rel of ['build', 'assets']) {
  const outDir = path.join(__dirname, '..', rel);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'icon.png'), png);
  console.log('wrote', rel + '/icon.png', png.length, 'bytes', SIZE + 'x' + SIZE);
}
