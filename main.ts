// news-image-20261124 entry (Node 22, standard library only).
//
// The entry is a program that writes one image summing up the world
// news of Tuesday 24 November 2026 to /output/entry.png. The image
// itself is held in this repository as entry.png; this program copies
// it to the output directory and verifies it is a whole PNG or JPEG
// before the grader reads it. No network is used and the run is
// deterministic: the same bytes are written every time.
//
// Run it the way the grader does:
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts

import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });

const here = dirname(fileURLToPath(import.meta.url));
const dest = join(outDir, "entry.png");
copyFileSync(join(here, "entry.png"), dest);

// Verify the written entry: it must exist, be non-empty, and start
// with a PNG or JPEG magic header (the competition judges the file
// by its header).
if (!existsSync(dest)) {
  throw new Error(`entry image missing after copy: ${dest}`);
}
const size = statSync(dest).size;
if (size === 0) {
  throw new Error(`entry image is empty: ${dest}`);
}
const head = readFileSync(dest).subarray(0, 8);
const isPng =
  head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47 &&
  head[4] === 0x0d && head[5] === 0x0a && head[6] === 0x1a && head[7] === 0x0a;
const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
if (!isPng && !isJpeg) {
  throw new Error(`entry image is neither PNG nor JPEG (bad magic header): ${dest}`);
}

// Enforce the competition's own limits locally: at most 1 MiB and
// 1024 by 1024 pixels. For a PNG the dimensions come from the IHDR
// chunk (width at bytes 16-19, height at bytes 20-23, big-endian).
const MAX_BYTES = 1024 * 1024;
if (size > MAX_BYTES) {
  throw new Error(`entry image is ${size} bytes, over the 1 MiB limit: ${dest}`);
}
if (isPng) {
  const buf = readFileSync(dest);
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (width > 1024 || height > 1024) {
    throw new Error(`entry image is ${width}x${height}, over the 1024x1024 limit: ${dest}`);
  }
  console.log(`Wrote ${dest} (${size} bytes, PNG, ${width}x${height})`);
} else {
  console.log(`Wrote ${dest} (${size} bytes, JPEG)`);
}
