/* ===================== Garment fitting: shop photo -> YOUR body =====================
 * RULE (do not regress): a shop photo is NEVER pasted as a plain rectangle.
 * 1. The cut-out is trimmed to the garment itself (transparent margins removed),
 *    and its outline is measured row by row (left/right edge of the fabric).
 * 2. On the avatar, every row is re-drawn at the width the garment would have on
 *    THIS body at that height: the photographed shape at true scale, widened where
 *    this body is wider than average, and never narrower than the body where it
 *    must cover it (bust down for tops/dresses/coats, everywhere for bottoms).
 *    Necklines, halters and straps above the bust keep their own shape.
 * 3. Length: the chart's "total length" in cm when known. The hem is placed at its REAL
 *    height above the floor: start point height (shoulder / bodice / waist, as a share of
 *    the user's height, GF_START) minus the length. Otherwise the photo's proportions
 *    re-scaled from the model's height to the user's.
 * 4. Getting the garment out of a shop photo is AUTOMATIC (gfExtract): the user only
 *    picks the photo. No box to draw, no manual selection step - ever.
 * Avatar frame: x centre 100; head top y=14, soles y=397 -> 383 units = user's height.
 */
const GF_ROWS = 64;
const GF_UNITS = 383;
const GF_STYLE = 0.9;   // the avatar is drawn a little slimmer than life
const GF_BUST_Y = 95;  // from here down a top/dress/coat must cover the body

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

// Automatic cut-out of the garment from a shop photo (RGBA buffer, edited in place).
// 1) studio background: flood-filled from the photo's edges (follows soft gradients),
// 2) the model's skin (face, neck, arms, legs): large skin-toned areas are removed,
// 3) leftovers (hair, shoes, bag, stray bits): only the biggest connected piece is kept.
// Returns { kept: fraction of pixels kept } or null if nothing usable was found.
function gfExtract(d, W, H) {
  const N = W * H, A = (p) => p * 4;
  const dist2 = (p, q) => { const a = A(p), b = A(q); const r = d[a] - d[b], g = d[a + 1] - d[b + 1], bl = d[a + 2] - d[b + 2]; return r * r + g * g + bl * bl; };
  // 1) Background reference: median of the border pixels.
  const border = [];
  for (let x = 0; x < W; x++) border.push(x, (H - 1) * W + x);
  for (let y = 1; y < H - 1; y++) border.push(y * W, y * W + W - 1);
  const med = (k) => { const v = border.map((p) => d[A(p) + k]).sort((a, b) => a - b); return v[v.length >> 1]; };
  const ref = [med(0), med(1), med(2)];
  const toRef = (p) => { const a = A(p); const r = d[a] - ref[0], g = d[a + 1] - ref[1], b = d[a + 2] - ref[2]; return r * r + g * g + b * b; };
  // How much the backdrop itself varies (soft gradients, vignettes) sets the tolerances:
  // a plain white studio backdrop gets a tight one, so pale / cream / white-ish fabric is
  // NOT eaten by the background fill (real case: a butter-yellow slip dress on white).
  let varSum = 0;
  for (const p of border) varSum += toRef(p);
  const spread = Math.sqrt(varSum / border.length);
  const T = Math.max(12, Math.min(40, 3 * spread));
  // Backdrop candidates: close to the backdrop colour. Pale fabric can have near-white
  // highlights, so the fill runs on an ERODED candidate mask: thin bridges of highlight
  // pixels through the fabric are cut, and the fill cannot leak into the garment.
  const cand = new Uint8Array(N);
  // tight on purpose: white / ivory garments on a light-grey backdrop differ from it by very little
  for (let p = 0; p < N; p++) cand[p] = toRef(p) < T * T ? 1 : 0;
  const R = Math.max(2, Math.round(Math.min(W, H) / 220));
  const morph = (src, keepIf) => { // separable square min (erode) or max (dilate), radius R
    const tmp = new Uint8Array(N), out = new Uint8Array(N);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = keepIf ? 1 : 0;
      for (let k = -R; k <= R; k++) { const xx = x + k; const s = xx < 0 || xx >= W ? (keepIf ? 1 : 0) : src[y * W + xx]; if (keepIf ? !s : s) { v = keepIf ? 0 : 1; break; } }
      tmp[y * W + x] = v;
    }
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let v = keepIf ? 1 : 0;
      for (let k = -R; k <= R; k++) { const yy = y + k; const s = yy < 0 || yy >= H ? (keepIf ? 1 : 0) : tmp[yy * W + x]; if (keepIf ? !s : s) { v = keepIf ? 0 : 1; break; } }
      out[y * W + x] = v;
    }
    return out;
  };
  const core = morph(cand, true); // eroded
  // Fill every sizeable region of backdrop: the outside, and also closed-off pockets such as
  // the gap between a sleeve and the body (real case: a leather jacket, sleeves held out).
  // Thin highlight streaks on fabric were removed by the erosion, so they never qualify.
  const fill = new Uint8Array(N), seen = new Uint8Array(N), minPocket = Math.max(40, N * 0.006); // a sleeve gap, not a highlight on white fabric
  for (let s0 = 0; s0 < N; s0++) {
    if (!core[s0] || seen[s0]) continue;
    const list = [s0]; seen[s0] = 1;
    let touches = false;
    for (let i = 0; i < list.length; i++) {
      const p = list[i], x = p % W, y = (p / W) | 0;
      if (x === 0 || y === 0 || x === W - 1 || y === H - 1) touches = true;
      for (const k of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) if (k >= 0 && k < N && core[k] && !seen[k]) { seen[k] = 1; list.push(k); }
    }
    // A closed pocket counts only if it IS the backdrop colour (a sleeve gap shows the
    // backdrop itself); a broad highlight on white satin is close, but not that close.
    let pocketBg = false;
    if (!touches && list.length >= minPocket) { let sum = 0; for (const p of list) sum += Math.sqrt(toRef(p)); pocketBg = sum / list.length < Math.max(2.5, 0.25 * T); }
    if (touches || pocketBg) for (const p of list) fill[p] = 1;
  }
  const grown = morph(fill, false); // dilate back to the garment's edge
  const bg = new Uint8Array(N);
  for (let p = 0; p < N; p++) bg[p] = grown[p] && cand[p] ? 1 : 0;
  for (const p of border) if (cand[p]) bg[p] = 1;
  // Narrow gaps the erosion skipped (between an arm and the body): spread into pixels that
  // are the backdrop colour almost exactly - tight enough not to enter pale fabric.
  {
    const tight = Math.max(4, 0.6 * T) ** 2, st = [];
    for (let p = 0; p < N; p++) if (bg[p]) st.push(p);
    while (st.length) {
      const p = st.pop(), x = p % W;
      for (const k of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) if (k >= 0 && k < N && !bg[k] && toRef(k) < tight) { bg[k] = 1; st.push(k); }
    }
  }
  // 2) Skin: YCbCr skin range, removed only as large connected areas (a print's small peach flowers stay).
  const skin = new Uint8Array(N);
  for (let p = 0; p < N; p++) {
    if (bg[p]) continue;
    const a = A(p), r = d[a], g = d[a + 1], b = d[a + 2];
    const y = 0.299 * r + 0.587 * g + 0.114 * b, cb = 128 - 0.1687 * r - 0.3313 * g + 0.5 * b, cr = 128 + 0.5 * r - 0.4187 * g - 0.0813 * b;
    if (y > 50 && cr > 135 && cr < 180 && cb > 80 && cb < 130 && r - g >= 18 && r > b) skin[p] = 1; // r-g: real skin is clearly redder than cream / butter-yellow fabric
  }
  const bgOnly = bg.slice();
  let fg = 0, skinOut = 0;
  for (let p = 0; p < N; p++) if (!bg[p]) fg++;
  // Only photos WITH a model get skin removed. A flat-lay or ghost-mannequin shot starts with a
  // collar or waistband at the top and ends with a hem at the bottom; a model photo shows a
  // neck / face at the top or legs / feet at the bottom. (Real case: a brown nappa jacket laid
  // flat - leather can look like skin, and a whole sleeve was being cut away.)
  let fy0 = H, fy1 = -1;
  for (let p = 0; p < N; p++) if (!bgOnly[p]) { const y = (p / W) | 0; if (y < fy0) fy0 = y; if (y > fy1) fy1 = y; }
  const bandShare = (ya, yb) => { let f = 0, sk = 0; for (let y = Math.max(0, ya); y <= Math.min(H - 1, yb); y++) for (let x = 0; x < W; x++) { const p = y * W + x; if (!bgOnly[p]) { f++; if (skin[p]) sk++; } } return f ? sk / f : 0; };
  const bandH = Math.max(2, Math.round((fy1 - fy0) * 0.08));
  const modelPhoto = fy1 > fy0 && Math.max(bandShare(fy0, fy0 + bandH), bandShare(fy1 - bandH, fy1)) > 0.3;
  if (!modelPhoto) skin.fill(0);
  const comp = new Int32Array(N).fill(-1), minSkin = Math.max(30, N * 0.004), minEdge = Math.max(12, N * 0.0006);
  for (let s = 0; s < N; s++) {
    if (!skin[s] || comp[s] >= 0) continue;
    const list = [s]; comp[s] = s;
    let edge = false; // skin that borders the backdrop is the model's body, not the print
    for (let i = 0; i < list.length; i++) {
      const p = list[i], x = p % W;
      for (const k of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) {
        if (k < 0 || k >= N) continue;
        if (bgOnly[k]) edge = true;
        else if (skin[k] && comp[k] < 0) { comp[k] = s; list.push(k); }
      }
    }
    if (list.length >= minSkin || (edge && list.length >= minEdge)) { for (const p of list) bg[p] = 1; skinOut += list.length; }
  }
  // A nude / beige / peach garment would look like skin: then keep it and skip this step.
  if (skinOut > fg * 0.65) bg.set(bgOnly);
  // 3) Keep the biggest connected piece (the garment).
  const lab = new Int32Array(N).fill(-1);
  let best = null;
  for (let s = 0; s < N; s++) {
    if (bg[s] || lab[s] >= 0) continue;
    const list = [s]; lab[s] = s;
    for (let i = 0; i < list.length; i++) {
      const p = list[i], x = p % W;
      for (const k of [x > 0 ? p - 1 : -1, x < W - 1 ? p + 1 : -1, p - W, p + W]) if (k >= 0 && k < N && !bg[k] && lab[k] < 0) { lab[k] = s; list.push(k); }
    }
    if (!best || list.length > best.length) best = list;
  }
  if (!best || best.length < N * 0.02) return null;
  const keep = new Uint8Array(N);
  for (const p of best) keep[p] = 1;
  for (let p = 0; p < N; p++) d[A(p) + 3] = keep[p] ? 255 : 0;
  return { kept: best.length / N };
}

// All "total length" values (cm) of a pasted size chart: [{ size, lengthCm }].
function gfChartLengths(chart) {
  if (!chart) return [];
  const lines = String(chart).split(/\n/).map((l) => l.split(/\s*\|\s*|\t+/).map((c) => c.trim()));
  const head = lines.find((c) => c.some((x) => /length|довжин/i.test(x)) && c.some((x) => /size|розмір|частина/i.test(x)));
  if (!head) return [];
  const col = head.findIndex((x) => /total length|length|довжин/i.test(x));
  const num = (s) => { const m = String(s || "").match(/\d+(?:[.,]\d+)?/); return m ? parseFloat(m[0].replace(",", ".")) : null; };
  // Only the rows of THIS table: from its header down to the next blank line or header
  // (a body chart and a garment chart are often pasted together).
  const rows = [];
  for (let i = lines.indexOf(head) + 1; i < lines.length; i++) {
    const c = lines[i];
    if (c.length === 1 && !c[0]) break;
    if (/^(size|розмір|частина)$/i.test(c[0])) break;
    const v = c.length > col ? num(c[col]) : null;
    if (v && v > 15 && v < 200 && /^[A-Z0-9]{1,4}$/i.test(c[0])) rows.push({ size: c[0].toUpperCase(), lengthCm: v });
  }
  return rows;
}

// "Total length" (cm) for one size (falls back to the middle size).
function gfChartLengthCm(chart, size) {
  const rows = gfChartLengths(chart);
  if (!rows.length) return null;
  const want = rows.find((r) => size && r.size === String(size).toUpperCase()) || rows[Math.floor(rows.length / 2)];
  return want.lengthCm;
}

// ---------- Where the hem really lands: measured from the floor, not from the model ----------
// A garment's "total length" starts at a point on the body; that point's height above the
// floor is a fixed share of the wearer's height (standard anthropometric proportions).
// The hem then sits at  startHeight - length  above the floor (negative = lying on the floor).
// RULE: never estimate length as "the model's hem moved by some % of the height difference".
const GF_START = {
  shoulder: 0.818, // high point of the shoulder: tops, coats, sleeved / wide-strap dresses
  bodice: 0.72,    // top edge of a strappy / slip / strapless / halter bodice (straps are adjustable)
  high: 0.62,      // high-waist bottoms: natural waist
  mid: 0.58,       // mid-rise bottoms
  low: 0.54,       // low-rise bottoms
};
function gfStartPoint(kind, text, rise) {
  if (kind === "bottom") return rise === "high" ? "high" : rise === "low" ? "low" : "mid";
  return /strap|spaghetti|slip dress|camisole|cami\b|bandeau|strapless|halter|corset|bretel|бретел|ramiącz|ramiacz|gorset/i.test(text || "") ? "bodice" : "shoulder";
}
function gfHemCm(lengthCm, userH, start) {
  return Math.round((GF_START[start] * userH - lengthCm) * 10) / 10;
}
// Plain-language length facts for the verdict and the screen.
function gfLengthFacts(chart, kind, text, rise, userH, modelH) {
  const rows = gfChartLengths(chart);
  if (!rows.length || !userH) return null;
  const start = gfStartPoint(kind, text, rise);
  return {
    measuredFrom: { shoulder: "the high point of the shoulder", bodice: "the top edge of the bodice (straps not included)", high: "the natural waist", mid: "a mid-rise waistband", low: "a low-rise waistband" }[start],
    bySize: rows.map((r) => ({ size: r.size, lengthCm: r.lengthCm, hemAboveFloorCmOnUser: gfHemCm(r.lengthCm, userH, start), hemAboveFloorCmOnModel: modelH ? gfHemCm(r.lengthCm, modelH, start) : null })),
    note: "hemAboveFloorCm: positive = that many cm above the floor; 0 to -3 = touches the floor (fine only with heels); below -3 = drags on the floor and needs hemming.",
  };
}
// No length in the chart: a typical length for the named style (midi, maxi...), so the hem is
// still placed from the floor. Marked as an estimate wherever it is shown.
function gfTypicalLengthCm(start, text) {
  const t = String(text || "").toLowerCase();
  const style = /maxi|floor|długa|довг/.test(t) ? "maxi" : /midi|calf|міді/.test(t) ? "midi" : /mini|міні/.test(t) ? "mini" : /knee|коліна/.test(t) ? "knee" : null;
  if (!style) return null;
  const table = {
    bodice: { mini: 78, knee: 92, midi: 108, maxi: 128 },
    shoulder: { mini: 85, knee: 100, midi: 118, maxi: 140 },
    high: { mini: 42, knee: 60, midi: 78, maxi: 98 }, mid: { mini: 40, knee: 58, midi: 75, maxi: 95 }, low: { mini: 38, knee: 56, midi: 72, maxi: 92 },
  };
  return table[start] ? table[start][style] : null;
}
function gfHemWords(cm, userH) {
  // Named by where it lands on THIS body (standard proportions of height), not by a fixed cm scale.
  if (cm < -3) return `${Math.round(-cm)} cm lying on the floor`;
  if (cm <= 3) return "at the floor";
  const where = (() => {
    if (!userH) return null;
    const r = cm / userH;
    if (r > 0.6) return "above the waist (cropped)";
    if (r > 0.55) return "at the waist";
    if (r > 0.49) return "at the high hip";
    if (r > 0.44) return "at the hips";
    if (r > 0.36) return "upper thigh";
    if (r > 0.3) return "just above the knee";
    if (r > 0.25) return "at the knee";
    if (r > 0.14) return "mid-calf";
    return "at the ankle";
  })();
  return `${Math.round(cm)} cm above the floor${where ? ` (${where})` : ""}`;
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
  const head = rows.slice(0, Math.max(2, Math.round(n * (kind === "upper" ? 0.2 : 0.06)))).filter(Boolean);
  if (!head.length) return null;
  const srcAnchor = Math.max(...head.map(([l, r]) => (r - l) / 2)); // fraction of box width
  // Length in avatar units.
  let gh;
  let hemCm = null;
  if (opts.lengthCm) {
    // Hem height above the floor from real body proportions (see GF_START), then drawn there.
    hemCm = gfHemCm(opts.lengthCm, userH, opts.start || (kind === "upper" ? "shoulder" : opts.rise || "mid"));
    gh = (397 - Math.max(0, hemCm) * (GF_UNITS / userH)) - y0;
  }
  else {
    // No chart length: read it off the photo. The anchor's real size on the model
    // (shoulders ≈ 22% of height, a flat waistband ≈ 19%) turns photo pixels into cm.
    const anchorHalfCm = (kind === "upper" ? 0.111 : 0.095) * modelH;
    const lengthCm = ((fit.box.h / fit.box.w) / (2 * srcAnchor)) * 2 * anchorHalfCm;
    gh = (lengthCm * GF_UNITS) / userH;
  }
  gh = Math.max(20, Math.min(396 - y0, gh));
  // Width: the garment keeps its photographed shape at true scale (photo px -> avatar
  // units, the same scale as the length), widened by how much wider this body is than
  // average at that height - and never narrower than the body itself where it must
  // cover it (from the bust down for tops/dresses/coats; everywhere for bottoms).
  // Above the bust (necklines, halters, straps) the garment's own shape is kept.
  const px = gh / fit.box.h; // avatar units per photo pixel
  const bh = gh / n, bands = [];
  for (let i = 0; i < n; i++) {
    const row = rows[i];
    if (!row) continue;
    const y = y0 + (i + 0.5) * bh;
    const own = ((row[1] - row[0]) / 2) * fit.box.w * px * GF_STYLE * widthAt(y, K);
    let body = torso(y);
    if (opts.loose && y > 100 && y < 182) body = Math.max(body, torso(100) + ((torso(182) - torso(100)) * (y - 100)) / 82);
    const covers = kind === "bottom" || y >= GF_BUST_Y;
    const half = covers ? Math.max(own, body + (kind === "upper" ? 2 : 1.2)) : own;
    bands.push({ y: y0 + i * bh, h: bh, l: row[0], r: row[1], half });
  }
  return { y0, gh, bands, hemCm };
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

if (typeof module !== "undefined") module.exports = { gfTypicalLengthCm, gfChartLengths, gfStartPoint, gfHemCm, gfLengthFacts, gfHemWords, GF_START, gfExtract, gfMeasure, gfChartLengthCm, gfPlan, gfSVG, gfLerp, GF_TORSO, GF_ROWS, GF_UNITS };
