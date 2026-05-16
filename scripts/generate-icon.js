// 외부 라이브러리 없이 앱 아이콘 생성 (새이파리 = 새 잎)
//  - build/icon.ico  : NSIS 설치/제거 아이콘 (멀티 사이즈, BMP 기반)
//  - build/icon.png  : 일반 용도 (512)
//  - assets/icon.png : 실행 중 창 아이콘 (asar 포함)
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const GREEN_BG = [30, 69, 48];   // #1E4530
const BEIGE = [234, 226, 208];   // #EAE2D0
const LEAF = [58, 122, 82];      // #3A7A52

// 지정한 크기로 RGBA 버퍼 렌더 (512 기준 좌표를 비례 축소)
function render(SIZE) {
  const buf = Buffer.alloc(SIZE * SIZE * 4);
  const k = SIZE / 512;

  function px(x, y, c, a = 255) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
    const i = (y * SIZE + x) * 4;
    const sa = a / 255;
    buf[i] = Math.round(buf[i] * (1 - sa) + c[0] * sa);
    buf[i + 1] = Math.round(buf[i + 1] * (1 - sa) + c[1] * sa);
    buf[i + 2] = Math.round(buf[i + 2] * (1 - sa) + c[2] * sa);
    buf[i + 3] = Math.max(buf[i + 3], a);
  }

  function roundedRectMask(x, y, w, h, radius) {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const dx = Math.min(x, w - 1 - x);
    const dy = Math.min(y, h - 1 - y);
    if (dx >= radius || dy >= radius) return true;
    const cxp = dx < radius ? radius : w - radius;
    const cyp = dy < radius ? radius : h - radius;
    return Math.hypot(x - cxp, y - cyp) <= radius;
  }

  function ellipse(cx, cy, rx, ry, c) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
      for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const v = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
        if (v <= 1) px(x, y, c, v > 0.9 ? Math.round(255 * (1 - (v - 0.9) / 0.1)) : 255);
      }
    }
  }

  const radius = 96 * k;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      if (roundedRectMask(x, y, SIZE, SIZE, radius)) {
        const i = (y * SIZE + x) * 4;
        buf[i] = GREEN_BG[0]; buf[i + 1] = GREEN_BG[1]; buf[i + 2] = GREEN_BG[2]; buf[i + 3] = 255;
      }

  for (let y = 250 * k; y < 410 * k; y++)
    for (let x = 246 * k; x < 266 * k; x++) px(x, y, BEIGE);

  ellipse(196 * k, 250 * k, 96 * k, 52 * k, LEAF);
  ellipse(316 * k, 224 * k, 96 * k, 52 * k, BEIGE);
  return buf;
}

// ---------- PNG ----------
const CRC_TABLE = (() => {
  const t = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(b) {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const tb = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([tb, data])), 0);
  return Buffer.concat([len, tb, data, crc]);
}
function toPNG(rgba, SIZE) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(SIZE, 0); ihdr.writeUInt32BE(SIZE, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  const raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
  for (let y = 0; y < SIZE; y++) {
    raw[y * (SIZE * 4 + 1)] = 0;
    rgba.copy(raw, y * (SIZE * 4 + 1) + 1, y * SIZE * 4, (y + 1) * SIZE * 4);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr), pngChunk('IDAT', idat), pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- ICO (BMP 기반, 32bpp + AND 마스크) ----------
function bmpForIco(rgba, S) {
  const header = Buffer.alloc(40);
  header.writeUInt32LE(40, 0);
  header.writeInt32LE(S, 4);
  header.writeInt32LE(S * 2, 8);   // height x2 (XOR + AND)
  header.writeUInt16LE(1, 12);     // planes
  header.writeUInt16LE(32, 14);    // bpp
  header.writeUInt32LE(0, 16);     // BI_RGB
  header.writeUInt32LE(S * S * 4, 20);
  const xor = Buffer.alloc(S * S * 4);
  for (let y = 0; y < S; y++) {
    const sy = S - 1 - y; // bottom-up
    for (let x = 0; x < S; x++) {
      const si = (y * S + x) * 4;
      const di = (sy * S + x) * 4;
      xor[di] = rgba[si + 2];     // B
      xor[di + 1] = rgba[si + 1]; // G
      xor[di + 2] = rgba[si];     // R
      xor[di + 3] = rgba[si + 3]; // A
    }
  }
  const andRow = (((S + 31) >> 5) << 2); // padded to 4 bytes
  const andMask = Buffer.alloc(andRow * S, 0); // 0 = opaque
  return Buffer.concat([header, xor, andMask]);
}
function toICO(sizes) {
  // 256 이상은 PNG, 그 미만은 BMP — NSIS/Windows 표준 호환
  const imgs = sizes.map(S => ({ S, data: S >= 256 ? toPNG(render(S), S) : bmpForIco(render(S), S) }));
  const dir = Buffer.alloc(6 + 16 * imgs.length);
  dir.writeUInt16LE(0, 0); dir.writeUInt16LE(1, 2); dir.writeUInt16LE(imgs.length, 4);
  let offset = dir.length;
  imgs.forEach((im, i) => {
    const e = 6 + i * 16;
    dir[e] = im.S >= 256 ? 0 : im.S;
    dir[e + 1] = im.S >= 256 ? 0 : im.S;
    dir[e + 2] = 0; dir[e + 3] = 0;
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(im.data.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += im.data.length;
  });
  return Buffer.concat([dir, ...imgs.map(im => im.data)]);
}

// ---------- write ----------
const png512 = toPNG(render(512), 512);
const ico = toICO([16, 24, 32, 48, 64, 128, 256]);

for (const rel of ['build', 'assets']) {
  const d = path.join(__dirname, '..', rel);
  fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'icon.png'), png512);
}
fs.writeFileSync(path.join(__dirname, '..', 'build', 'icon.ico'), ico);
console.log('wrote build/icon.ico', ico.length, 'bytes (16..256)');
console.log('wrote build/icon.png, assets/icon.png 512x512', png512.length, 'bytes');
