// The World Today — Wednesday 25 November 2026
// A deterministic newspaper front page summing up the day's world news.
// Drawn pixel by pixel into an RGB buffer with a hand-built 5x7 bitmap font,
// then encoded as a plain 8-bit RGB PNG. Node 22 standard library only.
// No network, no clock, no randomness: two runs write byte-identical output.

import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

const W = 1024;
const H = 1024;

type RGB = [number, number, number];

const PAPER: RGB = [252, 247, 236];
const INK: RGB = [18, 18, 18];
const RED: RGB = [176, 32, 32];
const NAVY: RGB = [14, 30, 62];
const GREEN: RGB = [44, 158, 66];
const MINT: RGB = [96, 200, 116];
const WHITE: RGB = [255, 255, 255];
const GREY: RGB = [96, 92, 84];
const HAIR: RGB = [198, 190, 174];

// ------------------------------------------------------------ pixel buffer
const img = Buffer.alloc(W * H * 3);

function put(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  img[i] = c[0];
  img[i + 1] = c[1];
  img[i + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) put(xx, yy, c);
  }
}

function rule(x: number, y: number, w: number, th: number, c: RGB): void {
  rect(x, y, w, th, c);
}

// Bresenham segment with square thickness.
function seg(x0: number, y0: number, x1: number, y1: number, c: RGB, th: number): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  const r = Math.floor(th / 2);
  for (;;) {
    for (let a = -r; a <= r; a++) {
      for (let b = -r; b <= r; b++) put(x + a, y + b, c);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      if (x * x + y * y <= r * r) put(cx + x, cy + y, c);
    }
  }
}

// ------------------------------------------------------------ PNG encoding
const CRC_TABLE: number[] = [];
for (let n = 0; n < 256; n++) {
  let v = n;
  for (let k = 0; k < 8; k++) v = v & 1 ? 0xedb88320 ^ (v >>> 1) : v >>> 1;
  CRC_TABLE.push(v >>> 0);
}

function crc32(buf: Buffer): number {
  let v = 0xffffffff;
  for (let i = 0; i < buf.length; i++) v = CRC_TABLE[(v ^ buf[i]) & 0xff] ^ (v >>> 8);
  return (v ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  const crc = crc32(Buffer.concat([Buffer.from(type, "ascii"), data]));
  out.writeUInt32BE(crc, 8 + data.length);
  return out;
}

function encodePng(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    img.copy(raw, y * (1 + W * 3) + 1, y * W * 3, (y + 1) * W * 3);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ------------------------------------------------------------ 5x7 bitmap font
// Each glyph is 7 rows of 5 bits, written as "0"/"1" strings.
// Only the characters the page needs: capitals, digits and punctuation.
const FONT: Record<string, string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01111", "10000", "10000", "10111", "10001", "10001", "01110"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "11001", "10101", "10011", "10011", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "0": ["01110", "10011", "10101", "11001", "10001", "10001", "01110"],
  "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["01110", "10000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00010", "00100", "00100", "00100"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00001", "01110"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
  ".": ["00000", "00000", "00000", "00000", "00000", "01100", "01100"],
  ",": ["00000", "00000", "00000", "00000", "01100", "01100", "01000"],
  ":": ["00000", "01100", "01100", "00000", "01100", "01100", "00000"],
  ";": ["00000", "01100", "01100", "00000", "01100", "01100", "01000"],
  "'": ["00100", "00100", "00100", "00000", "00000", "00000", "00000"],
  '"': ["01010", "01010", "01010", "00000", "00000", "00000", "00000"],
  "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
  "/": ["00001", "00001", "00010", "00100", "01000", "10000", "10000"],
  "%": ["11001", "11010", "00010", "00100", "01000", "01011", "10011"],
  $: ["00100", "01111", "10100", "01110", "00101", "11110", "00100"],
  "+": ["00000", "00100", "00100", "01110", "00100", "00100", "00000"],
  "(": ["00011", "00100", "01000", "01000", "01000", "00100", "00011"],
  ")": ["11000", "00100", "00010", "00010", "00010", "00100", "11000"],
  "&": ["01100", "10010", "10100", "01000", "10101", "10010", "01101"],
  "!": ["00100", "00100", "00100", "00100", "00100", "00000", "00100"],
  "?": ["01110", "10001", "00001", "00010", "00100", "00000", "00100"],
};

function glyph(ch: string): string[] {
  return FONT[ch] ?? FONT["?"];
}

// Draw one glyph with its top-left corner at (x, y); each font pixel is
// a scale x scale block. Unknown characters render as "?".
function drawGlyph(ch: string, x: number, y: number, s: number, c: RGB): void {
  const g = glyph(ch);
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r][col] === "1") rect(x + col * s, y + r * s, s, s, c);
    }
  }
}

function charAdvance(s: number): number {
  return 5 * s + s; // glyph width plus one pixel of tracking, scaled
}

function textWidth(text: string, s: number): number {
  if (text.length === 0) return 0;
  return text.length * charAdvance(s) - s;
}

function drawText(text: string, x: number, y: number, s: number, c: RGB): void {
  let cx = x;
  for (const ch of text) {
    if (ch !== " ") drawGlyph(ch, cx, y, s, c);
    cx += charAdvance(s);
  }
}

function drawCentred(text: string, cx: number, y: number, s: number, c: RGB): void {
  drawText(text, cx - Math.floor(textWidth(text, s) / 2), y, s, c);
}

// Split text into lines that fit maxW, breaking only on spaces.
function wrap(text: string, maxW: number, s: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur === "" ? w : cur + " " + w;
    if (textWidth(test, s) <= maxW) {
      cur = test;
    } else {
      if (cur !== "") lines.push(cur);
      cur = w;
    }
  }
  if (cur !== "") lines.push(cur);
  return lines;
}

function drawPara(text: string, x: number, y: number, maxW: number, s: number, c: RGB, gap: number): number {
  const lines = wrap(text, maxW, s);
  let yy = y;
  for (const ln of lines) {
    drawText(ln, x, yy, s, c);
    yy += 7 * s + gap;
  }
  return yy;
}

// ------------------------------------------------------------ the page
const MX = 36; // side margin
const CW = W - 2 * MX; // content width: 952

function drawPage(): void {
  rect(0, 0, W, H, PAPER);

  // Masthead.
  drawCentred("THE WORLD TODAY", W / 2, 36, 7, INK);
  rule(MX, 98, CW, 5, RED);

  // Date bar.
  rect(MX, 112, CW, 46, INK);
  drawCentred("WEDNESDAY 25 NOVEMBER 2026", W / 2, 124, 3, WHITE);

  // Lead story: war in the Gulf.
  drawText("WAR IN THE GULF", MX, 176, 2, RED);
  drawText("MINES IN THE STRAIT", MX, 198, 6, INK);
  drawText(
    "IRAN SAYS TANKERS HIT MINES AND CAUGHT FIRE IN THE WORLD'S KEY OIL PASSAGE",
    MX,
    250,
    2,
    INK,
  );
  rule(MX, 274, CW, 2, HAIR);
  drawPara(
    "IRAN'S REVOLUTIONARY GUARD SAID TWO OIL TANKERS STRUCK NAVAL MINES AND " +
      "CAUGHT FIRE IN THE STRAIT OF HORMUZ ON WEDNESDAY. TEHRAN ALSO CLAIMED " +
      "IT SHOT DOWN TWO US DRONES OVER THE STRAIT. PRESIDENT TRUMP SAID " +
      "FUNDING FOR THE US CAMPAIGN AGAINST IRAN IS SECURED THROUGH JANUARY.",
    MX,
    288,
    CW,
    2,
    INK,
    6,
  );

  // Numbers panel: the strait in numbers.
  rect(MX, 384, CW, 128, NAVY);
  drawText("THE STRAIT IN NUMBERS", MX + 20, 398, 2, WHITE);
  const panelNote = "OIL'S CHOKEPOINT, 25 NOV 2026";
  drawText(panelNote, MX + CW - 20 - textWidth(panelNote, 2), 398, 2, MINT);
  rule(MX + 20, 426, CW - 40, 2, WHITE);
  const stats: Array<[string, string]> = [
    ["2", "TANKERS HIT"],
    ["2", "US DRONES DOWNED"],
    ["21%", "OF WORLD OIL"],
    ["JAN 2027", "WAR FUNDS SECURED"],
  ];
  const colW = CW / 4;
  for (let i = 0; i < stats.length; i++) {
    const x = MX + i * colW + 20;
    drawText(stats[i][0], x, 440, 4, WHITE);
    drawText(stats[i][1], x, 480, 2, MINT);
  }
}

function drawColumns(): void {
  const colX = [MX, 352, 668];
  const colW = 304;
  const kickers = ["TRADE WAR", "SPACE", "MARKETS"];
  const heads = [
    "TARIFFS ON 14 PARTNERS",
    "PAKISTAN'S FIRST ASTRONAUT",
    "WALL ST SLIDES, BITCOIN SINKS",
  ];
  const bodies = [
    "WASHINGTON PROPOSES 20-40% TARIFFS ON 14 TRADING PARTNERS. " +
      "NOTHING TAKES EFFECT BEFORE A JANUARY 25 HEARING.",
    "CHINA'S SHENZHOU-24 DOCKED AT ITS SPACE STATION CARRYING " +
      "PAKISTAN'S MUHAMMAD ZEESHAN ALI, THE FIRST FOREIGN ASTRONAUT ABOARD.",
    "THE S&P 500 FELL 2.2% AND THE NASDAQ 3.2% ON AI, INFLATION AND " +
      "TARIFF FEARS. BITCOIN SLID BELOW $58,000.",
  ];
  for (let i = 0; i < 3; i++) {
    const x = colX[i];
    drawText(kickers[i], x, 532, 2, RED);
    drawPara(heads[i], x, 554, colW, 3, INK, 6);
    drawPara(bodies[i], x, 620, colW, 2, INK, 6);
    if (i > 0) rule(x - 12, 532, 2, 212, HAIR);
  }
}

function drawBrief(): void {
  rect(MX, 756, CW, 204, INK);
  drawText("IN BRIEF", MX + 20, 770, 2, RED);
  const items = [
    "AUSTRALIA AND SOLOMON ISLANDS SIGN TREATY BARRING FOREIGN BASES",
    "HOUTHIS SAY THEY HIT SAUDI ARABIA'S RAS TANURA OIL REFINERY",
    "SUDAN: RSF DRONE STRIKES KILL 19 CIVILIANS IN TWO CITIES",
    "ZELENSKY: UKRAINE NEEDS 115 BILLION EUROS IN AID FOR 2027",
    "BANGLADESH RAISES GARMENT WORKERS' WAGE 36% TO $139",
    "EUROZONE INFLATION RISES TO 4.0%",
    "US ARMY DESTROYS 5 TONS OF EXPLOSIVES IN IOWA",
    "SPACEX CLEARED TO FLY 1M ORBITAL DATA SATELLITES",
  ];
  let y = 796;
  for (const it of items) {
    rect(MX + 20, y + 3, 8, 8, RED);
    drawText(it, MX + 36, y, 2, WHITE);
    y += 20;
  }

  // Footer bar.
  rect(MX, 972, CW, 34, INK);
  drawCentred("THE WORLD TODAY - WEDNESDAY 25 NOVEMBER 2026", W / 2, 981, 2, WHITE);
}

function main(): void {
  drawPage();
  drawColumns();
  drawBrief();
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? path.join(process.cwd(), "out");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "entry.png"), encodePng());
}

main();
