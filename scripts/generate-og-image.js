/**
 * generate-og-image.js — Creates og-image.png for social media previews.
 * Run: node scripts/generate-og-image.js
 */
import sharp from "sharp";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// OG image standard: 1200×630
const WIDTH = 1200;
const HEIGHT = 630;

// Colors from the design system
const ACCENT = "#6366f1";
const SCOPE = "#75AADB";
const COMPLETED = "#FCBF49";
const WHITE = "#ffffff";

// Build the SVG for the OG image
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6366f1"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#bg)"/>

  <!-- Subtle grid dots -->
  <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
    <circle cx="20" cy="20" r="1" fill="white" opacity="0.08"/>
  </pattern>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#dots)"/>

  <!-- Icon (centered, large) -->
  <g transform="translate(480, 140) scale(8)">
    <rect width="32" height="32" rx="8" fill="white" opacity="0.15"/>
    <path d="M6 24V6" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <path d="M6 24H26" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <path d="M6 8H26" stroke="white" stroke-width="1.5" stroke-linecap="round" opacity="0.5" stroke-dasharray="3 2"/>
    <path d="M6 22C9 22 11 16 14 14C17 12 19 10 26 8" stroke="${SCOPE}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M6 22C9 22 12 18 16 14C20 10 22 10 26 10" stroke="${COMPLETED}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
  </g>

  <!-- Title -->
  <text x="600" y="490" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="56" font-weight="700" fill="white">
    Burnup Chart Generator
  </text>

  <!-- Subtitle -->
  <text x="600" y="545" text-anchor="middle" font-family="system-ui, -apple-system, Segoe UI, Roboto, sans-serif" font-size="28" font-weight="400" fill="white" opacity="0.7">
    Generate and share burnup charts via URL — no server required
  </text>
</svg>
`;

const outPath = resolve(root, "public", "og-image.png");

const { data, info } = await sharp(Buffer.from(svg))
  .png()
  .toFile(outPath);

console.log(`✓ OG image generated: ${outPath}`);
console.log(`  Size: ${info.width}×${info.height}, ${info.size} bytes`);
