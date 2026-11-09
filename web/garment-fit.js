/* ===================== Garment fitting: shop photo -> YOUR body =====================
 * RULE (do not regress): a shop photo is NEVER pasted as a plain rectangle.
 * 1. The cut-out is trimmed to the garment itself (transparent margins removed),
 *    and its outline is measured row by row (left/right edge of the fabric).
 * 2. On the avatar, every row is re-drawn at the width the garment would have on
 *    THIS body at that height: never narrower than the body + ease, and keeping the
 *    garment's own shape (flare, wide legs, sleeves) relative to its anchor
 *    (shoulders for tops/dresses/coats, waistband for skirts/trousers).
 * 3. Length: the chart's "total length" in cm when known (cm -> avatar units by
 *    the user's height); otherwise the photo's proportions re-scaled from the
 *    model's height to the user's.
 * Avatar frame: x centre 100; head top y=14, soles y=397 -> 383 units = user's height.
 */
const GF_ROWS = 64;
const GF_UNITS = 383;

// Half-width of the neutral avatar (all factors 1) at height y, local units.
const GF_TORSO = [[70, 14], [76, 30], [100, 31], [128, 24], [150, 27], [172, 30], [182, 33], [234, 32], [300, 22], [352, 20], [390, 17]];

function gfLerp(tab, y) {
  if (y <= tab[0][0]) return tab[0][1];
  for (let i = 1; i < tab.length; i++) {
    if (y <= tab[i][0]) { const [y0, v0] = tab[i - 1], [y1, v1] = tab[i]; return v0 + ((v1 - v0) * (y - y0)) / (y1 - y0); }
  }
  return tab[tab.length - 1][1];
}

// Measure the garment outline in an RGBA buffer. Returns the trimmed bounding box
// (pixels) and GF_ROWS rows of [left, right] as fractions of the box width (null = empty row).
function gfMeasure(data, W, H, alphaMin = 40) {
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (data[(y * W + x) * 4 + 3] >= alphaMin) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1, rows = [];
  for (let i = 0; i < GF_ROWS; i++) {
    const ya = y0 + Math.floor((i * bh) / GF_ROWS), yb = Math.max(ya + 1, y0 + Math.floor(((i + 1) * bh) / GF_ROWS));
    let l = Infinity, r = -1;
    for (let y = ya; y < yb && y <= y1; y++) {
      // ignore single stray pixels: need a short run of fabric
      for (let x = x0; x <= x1; x++) if (data[(y * W + x) * 4 + 3] >= alphaMin && (x === x1 || data[(y * W + x + 1) * 4 + 3] >= alphaMin)) { if (x < l) l = x; break; }
      for (let x = x1; x >= x0; x--) if (data[(y * W + x) * 4 + 3] >= alphaMin && (x === x0 || data[(y * W + x - 1) * 4 + 3] >= alphaMin)) { if (x > r) r = x; break; }
    }
    rows.push(r >= l && r >= 0 ? [(l - x0) / bw, (r - x0 + 1) / bw] : null);
  }
  return { box: { x: x0, y: y0, w: bw, h: bh }, rows };
}

// Pull "total length" (cm) for a size out of a pasted size-chart text.
function gfChartLengthCm(chart, size) {
  if (!chart) return null;
  const lines = String(chart).split(/\n/).map((l) => l.split(/\s*\|\s*|\t+/).map((c) => c.trim()));
  const head = lines.find((c) => c.some((x) => /length|довжин/i.test(x)) && c.some((x) => /size|розмір|частина/i.test(x)));
  if (!head) return null;
  const col = head.findIndex((x) => /total length|length|довжин/i.test(x));
  const num = (s) => { const m = String(s || "").match(/\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(",", ".")) : null; };
  const rows = lines.filter((c) => c !== head && c.length > col && num(c[col]) !== null && /^[A-Z0-9]{1,4}$/i.test(c[0]));
  if (!rows.length) return null;
  const want = rows.find((c) => size && c[0].toUpperCase() === String(size).toUpperCase()) || rows[Math.floor(rows.length / 2)];
  const v = num(want[col]);
  return v && v > 15 && v < 200 ? v : null;
}

// Plan the bands: where each measured row of the photo lands on the avatar and how wide.
// kind: "upper" (top / dress / coat) or "bottom" (skirt / trousers).
// opts: { K (bodyFactors + widthAt), widthAt, modelH, lengthCm, rise: "high"|"mid"|"low", loose }
function gfPlan(fit, kind, opts) {
  const { K, widthAt } = opts;
  const rows = fit.rows, n = rows.length;
  const userH = K.h, modelH = opts.modelH || 176;
  const y0 = kind === "upper" ? 68 : opts.rise === "high" ? 134 : opts.rise === "low" ? 160 : 148;
  const torso = (y) => gfLerp(GF_TORSO, y) * widthAt(y, K);
  // Anchor: widest row near the top (shoulders / waistband).
  const head = rows.slice(0, Math.max(2, Math.round(n * (kind === "upper" ? 0.1 : 0.06)))).filter(Boolean);
  if (!head.length) return null;
  const srcAnchor = Math.max(...head.map(([l, r]) => (r - l) / 2)); // fraction of box width
  const yAnchor = kind === "upper" ? 78 : y0 + 2;
  const bodyAnchor = torso(yAnchor);
  // Length in avatar units.
  let gh;
  if (opts.lengthCm) gh = (opts.lengthCm * GF_UNITS) / userH;
  else {
    // No chart length: read it off the photo. The anchor's real size on the model
    // (shoulders ≈ 22% of height, a flat waistband ≈ 19%) turns photo pixels into cm.
    const anchorHalfCm = (kind === "upper" ? 0.111 : 0.095) * modelH;
    const lengthCm = ((fit.box.h / fit.box.w) / (2 * srcAnchor)) * 2 * anchorHalfCm;
    gh = (lengthCm * GF_UNITS) / userH;
  }
  gh = Math.max(20, Math.min(394 - y0, gh));
  const bh = gh / n, bands = [];
  for (let i = 0; i < n; i++) {
    const row = rows[i];
    if (!row) continue;
    const y = y0 + (i + 0.5) * bh;
    const srcHalf = (row[1] - row[0]) / 2;
    let body = torso(y);
    if (opts.loose && y > 100 && y < 182) body = Math.max(body, torso(100) + ((torso(182) - torso(100)) * (y - 100)) / 82);
    const ease = kind === "upper" ? 2 : 1.2;
    const half = Math.max((srcHalf / srcAnchor) * bodyAnchor, body + ease);
    bands.push({ y: y0 + i * bh, h: bh, l: row[0], r: row[1], half });
  }
  return { y0, gh, bands };
}

// Render a plan as SVG: one shared <image>, each band clipped and stretched to its width.
function gfSVG(url, plan, id) {
  const IW = 100; // the image is laid out 0..IW wide, then each band is moved/scaled into place
  let out = `<defs><image id="${id}i" href="${url}" x="0" y="${plan.y0.toFixed(2)}" width="${IW}" height="${plan.gh.toFixed(2)}" preserveAspectRatio="none"/>`;
  plan.bands.forEach((b, i) => { out += `<clipPath id="${id}${i}"><rect x="0" y="${b.y.toFixed(2)}" width="200" height="${(b.h + 1.2).toFixed(2)}"/></clipPath>`; });
  out += `</defs>`;
  plan.bands.forEach((b, i) => {
    const s = (2 * b.half) / ((b.r - b.l) * IW), cx = ((b.l + b.r) / 2) * IW;
    out += `<g clip-path="url(#${id}${i})"><use href="#${id}i" transform="translate(${(100 - s * cx).toFixed(2)} 0) scale(${s.toFixed(4)} 1)"/></g>`;
  });
  return out;
}

if (typeof module !== "undefined") module.exports = { gfMeasure, gfChartLengthCm, gfPlan, gfSVG, gfLerp, GF_TORSO, GF_ROWS, GF_UNITS };
