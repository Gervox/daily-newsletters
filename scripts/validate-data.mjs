// Pulisce e controlla docs/data/latest.json prima della pubblicazione.
// Blocca tutto ciò che può rivelare le caselle email: link a Gmail, indirizzi, link di tracciamento.
// Uso: node scripts/validate-data.mjs
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "docs/data/latest.json";
const TAGS = ["Attualità", "Tendenze", "Curiosità"];
const BLOCKED_HOSTS = /(^|\.)(mail\.google\.com|googlemail\.com|inbox\.google\.com|outlook\.live\.com|outlook\.office\.com|mail\.yahoo\.com|list-manage\.com|mail\.beehiiv\.com|sendgrid\.net|mailchi\.mp|substackcdn\.com|mailchimp\.com|campaign-archive\.com|hubspotemail\.net|convertkit-mail\.com|klclick\.com|ct\.sendgrid\.net)$/i;
const TRACKING_PARAMS = /^(utm_|mc_|_hs|fbclid|gclid|ref_src|_bhlid|vero_|mkt_tok|oly_|s_cid|igshid)/i;
const TRACKING_PATH = /\/(ss\/c|ls\/click|track\/click|e\/c|c\/eJ|wf\/click|redirect)\b/i;
const errors = [];
const fail = (where, msg) => errors.push(`${where}: ${msg}`);

const raw = readFileSync(FILE, "utf8");
const data = JSON.parse(raw);

if (/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/.test(raw)) fail("file", "contiene un indirizzo email");
if (/authuser|#inbox|mail\.google|message_id|thread_id/i.test(raw)) fail("file", "contiene riferimenti a Gmail");
if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date || "")) fail("date", "deve essere AAAA-MM-GG");
if (!["mattina", "sera"].includes(data.edition)) fail("edition", 'deve essere "mattina" o "sera"');

function cleanUrl(where, value) {
  if (value == null || value === "") return null;
  let u;
  try { u = new URL(value); } catch { fail(where, `link non valido: ${value}`); return null; }
  if (u.protocol !== "https:") { fail(where, `il link deve essere https: ${value}`); return null; }
  if (BLOCKED_HOSTS.test(u.hostname) || (/(^|\.)google\.com$/i.test(u.hostname) && u.pathname.startsWith("/mail"))) {
    fail(where, `link a posta o tracciamento non ammesso: ${u.hostname}`); return null;
  }
  if (TRACKING_PATH.test(u.pathname) || /^(link|click|email|track|trk|go|t)\./i.test(u.hostname) && u.pathname.length > 60) {
    fail(where, `sembra un link di tracciamento della newsletter: ${value}`); return null;
  }
  for (const key of [...u.searchParams.keys()]) if (TRACKING_PARAMS.test(key)) u.searchParams.delete(key);
  return u.href;
}

function checkList(name, max, withTag) {
  const list = data[name];
  if (!Array.isArray(list) || list.length === 0) return fail(name, "lista mancante o vuota");
  if (list.length > max) fail(name, `massimo ${max} voci, trovate ${list.length}`);
  list.forEach((item, i) => {
    const where = `${name}[${i + 1}]`;
    for (const field of ["k", "title", "summary", "source"]) {
      if (typeof item[field] !== "string" || !item[field].trim()) fail(where, `campo "${field}" mancante`);
    }
    if (item.note != null && typeof item.note !== "string") fail(where, 'campo "note" non valido');
    if (withTag && !TAGS.includes(item.tag)) fail(where, `tag deve essere uno fra: ${TAGS.join(", ")}`);
    item.url = cleanUrl(where, item.url);
    if (name === "tools" && !item.url) fail(where, "ogni tool deve avere il link al sito ufficiale");
  });
}
checkList("news", 10, false);
checkList("tools", 10, false);
checkList("extra", 10, true);

if (errors.length) {
  console.error("DATI NON PUBBLICABILI:\n- " + errors.join("\n- "));
  process.exit(1);
}
writeFileSync(FILE, JSON.stringify(data, null, 2) + "\n");
const linked = data.news.filter((n) => n.url).length;
console.log(`OK ${data.date} ${data.edition}: ${data.news.length} notizie (${linked} con link), ${data.tools.length} tool, ${data.extra.length} extra.`);
