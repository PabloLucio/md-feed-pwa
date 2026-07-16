const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function parsePNG(buf) {
  let pos = 8;
  let ihdr = null, idat = null;
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos + 4, pos + 8).toString('ascii');
    const data = buf.slice(pos + 8, pos + 8 + len);
    if (type === 'IHDR') ihdr = data;
    if (type === 'IDAT') idat = data;
    pos += 12 + len;
  }
  const w = ihdr.readUInt32BE(0);
  const h = ihdr.readUInt32BE(4);
  const ct = ihdr[9]; // 2=RGB, 6=RGBA
  const bpp = ct === 6 ? 4 : 3;
  const raw = zlib.inflateSync(idat);
  return { w, h, bpp, raw };
}

function crc32(buf) {
  let c = 0xffffffff;
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let v = n;
    for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
    t[n] = v;
  }
  for (let i = 0; i < buf.length; i++) c = t[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const cr = Buffer.alloc(4); cr.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, cr]);
}

function buildPNG(w, h, ct, raw) {
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);
  const ih = Buffer.alloc(13);
  ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4);
  ih[8] = 8; ih[9] = ct; ih[10] = 0; ih[11] = 0; ih[12] = 0;
  return Buffer.concat([sig, makeChunk('IHDR', ih), makeChunk('IDAT', zlib.deflateSync(raw)), makeChunk('IEND', Buffer.alloc(0))]);
}

function scale(src, factor) {
  const { w, h, bpp, raw } = src;
  const rowIn = w * bpp + 1;
  const rowOut = w * bpp + 1;
  // Sample region: center of source, size w/factor x h/factor
  const sw = w / factor, sh = h / factor;
  const ox = (w - sw) / 2, oy = (h - sh) / 2;
  const out = Buffer.alloc(h * rowOut);

  for (let dy = 0; dy < h; dy++) {
    out[dy * rowOut] = 0;
    const sy = oy + (dy / h) * sh;
    const y0 = Math.min(Math.floor(sy), h - 1);
    const y1 = Math.min(y0 + 1, h - 1);
    const fy = sy - y0;
    for (let dx = 0; dx < w; dx++) {
      const sx = ox + (dx / w) * sw;
      const x0 = Math.min(Math.floor(sx), w - 1);
      const x1 = Math.min(x0 + 1, w - 1);
      const fx = sx - x0;
      for (let c = 0; c < bpp; c++) {
        const a = raw[y0*rowOut+1+x0*bpp+c], b = raw[y0*rowOut+1+x1*bpp+c];
        const cc = raw[y1*rowOut+1+x0*bpp+c], d = raw[y1*rowOut+1+x1*bpp+c];
        out[dy*rowOut+1+dx*bpp+c] = Math.round(a*(1-fx)*(1-fy)+b*fx*(1-fy)+cc*(1-fx)*fy+d*fx*fy);
      }
    }
  }
  return out;
}

const dir = path.join(__dirname, 'md-feed', 'md-generator');

[192, 512].forEach(size => {
  const src = parsePNG(fs.readFileSync(path.join(dir, `icon-${size}.png`)));
  const raw = scale(src, 1.25);
  const out = buildPNG(src.w, src.h, src.ct, raw);
  fs.writeFileSync(path.join(dir, `icon-${size}.png`), out);
  console.log(`icon-${size}.png: ${out.length} bytes`);
});
