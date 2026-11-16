// Genera le icone dell'app (web, Android, iOS) dalla mascotte. Uso: node scripts/make-icons.mjs
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const head = `
  <path d="M64 46 C30 38 6 68 10 110 C13 140 32 154 48 136 C58 122 60 92 72 72Z" fill="#b8731a" stroke="#18202c" stroke-width="5" stroke-linejoin="round"/>
  <path d="M176 46 C210 38 234 68 230 110 C227 140 208 154 192 136 C182 122 180 92 168 72Z" fill="#b8731a" stroke="#18202c" stroke-width="5" stroke-linejoin="round"/>
  <path d="M120 20 C162 20 188 50 188 90 C188 132 160 160 120 160 C80 160 52 132 52 90 C52 50 78 20 120 20Z" fill="#dba659" stroke="#18202c" stroke-width="5"/>
  <path d="M104 23 C106 8 118 4 123 16 C130 6 141 12 137 25" fill="#dba659" stroke="#18202c" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="120" cy="122" rx="40" ry="32" fill="#f3d7a6"/>
  <path d="M104 104 Q120 94 136 104 Q136 118 120 122 Q104 118 104 104Z" fill="#18202c"/>
  <path d="M111 139 Q120 160 129 139Z" fill="#a8405f" stroke="#18202c" stroke-width="3" stroke-linejoin="round"/>
  <path d="M120 122 V132 M120 132 Q110 144 98 136 M120 132 Q130 144 142 136" fill="none" stroke="#18202c" stroke-width="4" stroke-linecap="round"/>
  <circle cx="94" cy="80" r="7.5" fill="#18202c"/><circle cx="146" cy="80" r="7.5" fill="#18202c"/>
  <circle cx="96.5" cy="77.5" r="2.4" fill="#fff"/><circle cx="148.5" cy="77.5" r="2.4" fill="#fff"/>
  <circle cx="92" cy="80" r="23" fill="#ffffff" fill-opacity=".38" stroke="#18202c" stroke-width="5"/>
  <circle cx="148" cy="80" r="23" fill="#ffffff" fill-opacity=".38" stroke="#18202c" stroke-width="5"/>
  <path d="M115 78 Q120 72 125 78 M69 76 L57 71 M171 76 L183 71" fill="none" stroke="#18202c" stroke-width="5" stroke-linecap="round"/>`;

const paper = `
  <path d="M-10 172 L120 188 L120 260 L-10 260Z" fill="#ffffff" stroke="#18202c" stroke-width="5" stroke-linejoin="round"/>
  <path d="M250 172 L120 188 L120 260 L250 260Z" fill="#f4f6f8" stroke="#18202c" stroke-width="5" stroke-linejoin="round"/>
  <g transform="translate(-10 172) skewY(7)"><rect x="18" y="20" width="96" height="9" rx="4.5" fill="#18202c"/><rect x="18" y="38" width="80" height="6" rx="3" fill="#566172"/></g>
  <g transform="translate(250 172) scale(-1 1) skewY(7)"><rect x="18" y="20" width="96" height="9" rx="4.5" fill="#18202c"/><rect x="18" y="38" width="80" height="6" rx="3" fill="#566172"/></g>`;

// scale: quanto è grande la mascotte dentro il quadrato (le icone "maskable" vogliono più margine)
function icon({ scale = 2.55, bg = true, radius = 0 }) {
  const w = 240 * scale;
  const x = (512 - w) / 2;
  const y = 512 - 232 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 512 512">
    <defs><clipPath id="c"><rect width="512" height="512" rx="${radius}"/></clipPath></defs>
    <g clip-path="url(#c)">
      ${bg ? '<rect width="512" height="512" fill="#0e6b6b"/><circle cx="256" cy="250" r="214" fill="#5cc4c4"/>' : ""}
      <g transform="translate(${x} ${y}) scale(${scale})">${head}${paper}</g>
    </g>
  </svg>`;
}

const out = async (svg, size, file) => sharp(Buffer.from(svg)).resize(size, size).png().toFile(file);

mkdirSync("docs/icons", { recursive: true });
mkdirSync("assets", { recursive: true });

const full = icon({ scale: 1.72 });
const maskable = icon({ scale: 1.36 });
await out(full, 192, "docs/icons/icon-192.png");
await out(full, 512, "docs/icons/icon-512.png");
await out(full, 180, "docs/icons/apple-touch-icon.png");
await out(maskable, 512, "docs/icons/icon-maskable-512.png");

// sorgenti per @capacitor/assets (icone e splash di Android e iOS)
await out(full, 1024, "assets/icon-only.png");
await out(icon({ scale: 1.2, bg: false }), 1024, "assets/icon-foreground.png");
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: "#0e6b6b" } }).png().toFile("assets/icon-background.png");
const splashDog = await sharp(Buffer.from(icon({ scale: 1.72, radius: 256 }))).resize(760, 760).png().toBuffer();
for (const [name, color] of [["splash", "#e8ebef"], ["splash-dark", "#18202c"]]) {
  await sharp({ create: { width: 2732, height: 2732, channels: 4, background: color } })
    .composite([{ input: splashDog, gravity: "center" }]).png().toFile(`assets/${name}.png`);
}
console.log("Icone generate in docs/icons e assets/");
