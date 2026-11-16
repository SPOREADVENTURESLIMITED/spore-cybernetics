import { mkdir, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const name = Buffer.from(type);
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0); name.copy(out, 4); data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([name, data])), 8 + data.length);
  return out;
}
function segmentDistance(x, y, a, b) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x-a[0])*dx + (y-a[1])*dy) / (dx*dx + dy*dy)));
  return Math.hypot(x-a[0]-t*dx, y-a[1]-t*dy);
}
function makePng(size) {
  const segments = [
    [[.68,.30],[.40,.27]], [[.40,.27],[.30,.38]], [[.30,.38],[.62,.51]],
    [[.62,.51],[.69,.63]], [[.69,.63],[.58,.74]], [[.58,.74],[.31,.70]]
  ];
  const nodes = [[.30,.38],[.68,.30],[.69,.63],[.31,.70]];
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    const row = y * (size * 4 + 1); raw[row] = 0;
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      let color = [5, 22, 52, 255];
      if (u > .055 && u < .945 && v > .055 && v < .945 &&
          (u < .075 || u > .925 || v < .075 || v > .925)) color = [35, 210, 235, 255];
      if (segments.some(([a,b]) => segmentDistance(u,v,a,b) < .034)) color = [235,250,255,255];
      if (nodes.some(([a,b]) => Math.hypot(u-a,v-b) < .038)) color = [35,225,245,255];
      const offset = row + 1 + x * 4;
      raw.set(color, offset);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size,0); ihdr.writeUInt32BE(size,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, {level:9})), chunk("IEND", Buffer.alloc(0))
  ]);
}
await mkdir("public", { recursive: true });
for (const size of [192, 512]) await writeFile(`public/icon-${size}.png`, makePng(size));
console.log("Generated Spore Cybernetics PWA icons: 192x192 and 512x512.");
