// Regression tests: a shop photo must be fitted to the user's body, never pasted as a rectangle.
// Run: node --test web/test
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");
const gf = require("../garment-fit.js");

const html = fs.readFileSync(path.join(__dirname, "..", "will-it-fit-me.html"), "utf8");
const grab = (name) => { const a = html.indexOf(`function ${name}(`); let i = html.indexOf("{", a), d = 0; for (; i < html.length; i++) { if (html[i] === "{") d++; else if (html[i] === "}" && --d === 0) break; } return html.slice(a, i + 1); };
// The app's own body model (bodyFactors + widthAt), run against a fake profile.
const makeBody = (m) => new Function("S", `${grab("bodyFactors")}\n${grab("widthAt")}\nreturn { K: bodyFactors(), widthAt };`)({ data: { m } });

const SLIM = { heightCm: 155, bustCm: 80, waistCm: 60, hipsCm: 86, shouldersCm: 34 };
const CURVY = { heightCm: 180, bustCm: 106, waistCm: 92, hipsCm: 120, shouldersCm: 42, thighCm: 68 };

// A synthetic straight-leg trousers cut-out: 100x300, opaque trapezoid.
function trousers() {
  const W = 100, H = 300, d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 20; x < 80; x++) d[(y * W + x) * 4 + 3] = 255;
  return gf.gfMeasure(d, W, H);
}

test("outline is trimmed to the garment and measured per row", () => {
  const f = trousers();
  assert.deepStrictEqual(f.box, { x: 20, y: 0, w: 60, h: 300 });
  assert.strictEqual(f.rows.length, gf.GF_ROWS);
  assert.ok(f.rows.every((r) => r[0] === 0 && r[1] === 1));
});

test("the garment follows the body: wider body -> wider garment at the same height", () => {
  const f = trousers();
  const a = makeBody(SLIM), b = makeBody(CURVY);
  const pa = gf.gfPlan(f, "bottom", { ...a, modelH: 179 }), pb = gf.gfPlan(f, "bottom", { ...b, modelH: 179 });
  const hipA = pa.bands.find((x) => x.y + x.h > 182).half, hipB = pb.bands.find((x) => x.y + x.h > 182).half;
  assert.ok(hipB > hipA * 1.2, `curvy hips ${hipB} should be clearly wider than slim ${hipA}`);
});

test("never narrower than the body at any height (no rectangle pasted over the body)", () => {
  const f = trousers();
  for (const m of [SLIM, CURVY]) {
    const B = makeBody(m), plan = gf.gfPlan(f, "bottom", { ...B, modelH: 179 });
    for (const band of plan.bands) {
      const y = band.y + band.h / 2;
      assert.ok(band.half >= gf.gfLerp(gf.GF_TORSO, y) * B.widthAt(y, B.K), `band at y=${y.toFixed(1)} narrower than the body`);
    }
    assert.ok(new Set(plan.bands.map((b) => b.half.toFixed(2))).size > 3, "band widths must vary with the body shape");
  }
});

test("chart length is read for the recommended size", () => {
  const chart = "Size | Waist flat | Hips flat | Total length | Front rise\nXS | 35.5 | 46.0 | 99.0 | 31\nS | 36.5 | 48.0 | 99.5 | 32\nM | 37.5 | 50.0 | 100.0 | 33";
  assert.strictEqual(gf.gfChartLengthCm(chart, "S"), 99.5);
  assert.strictEqual(gf.gfChartLengthCm(chart, "XL"), 99.5); // unknown size -> middle row
  assert.strictEqual(gf.gfChartLengthCm("no table here", "S"), null);
});

test("the same garment is relatively longer on a shorter person", () => {
  const f = trousers();
  const pa = gf.gfPlan(f, "bottom", { ...makeBody(SLIM), modelH: 179, lengthCm: 100 });
  const pb = gf.gfPlan(f, "bottom", { ...makeBody(CURVY), modelH: 179, lengthCm: 100 });
  assert.ok(pa.gh > pb.gh, "100 cm trousers must cover more of a 155 cm body than a 180 cm body");
});

test("the app embeds this exact fitting module and uses it for every photo", () => {
  const mod = fs.readFileSync(path.join(__dirname, "..", "garment-fit.js"), "utf8");
  const body = mod.slice(0, mod.indexOf("if (typeof module")).trim();
  assert.ok(html.includes(body), "web/will-it-fit-me.html is out of sync with web/garment-fit.js");
  assert.ok(!/photoOnBody|<image href="\$\{(upperPhoto|bottomPhoto)\.url\}"/.test(html), "a photo is drawn without the fitter");
  assert.ok((html.match(/fitPhoto\(/g) || []).length >= 3, "both upper and bottom photos must go through fitPhoto");
});

// ---------- Automatic cut-out: the user only picks a photo, nothing to select ----------

// A studio photo: soft grey gradient backdrop, the model's skin-toned arms (touching the
// backdrop), a dark garment with small peach "print" dots, and dark shoes below bare ankles.
function studioPhoto(garment = [25, 25, 28]) {
  const W = 120, H = 200, d = new Uint8ClampedArray(W * H * 4);
  const set = (x, y, c) => { const a = (y * W + x) * 4; d[a] = c[0]; d[a + 1] = c[1]; d[a + 2] = c[2]; d[a + 3] = 255; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = Math.round(214 + (14 * y) / H - (6 * x) / W); set(x, y, [v, v - 2, v - 5]); }
  const skin = [222, 170, 140];
  for (let y = 30; y < 120; y++) { for (let x = 22; x < 32; x++) set(x, y, skin); for (let x = 88; x < 98; x++) set(x, y, skin); } // arms
  for (let y = 25; y < 170; y++) for (let x = 35; x < 85; x++) set(x, y, garment); // garment
  for (let y = 170; y < 185; y++) { for (let x = 45; x < 52; x++) set(x, y, skin); for (let x = 68; x < 75; x++) set(x, y, skin); } // ankles
  for (let y = 185; y < 190; y++) { for (let x = 42; x < 55; x++) set(x, y, [20, 20, 20]); for (let x = 65; x < 78; x++) set(x, y, [20, 20, 20]); } // shoes
  for (const [cx, cy] of [[50, 60], [70, 100], [60, 140]]) for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) set(x, y, [240, 190, 150]); // print
  return { d, W, H, alpha: (x, y) => d[(y * W + x) * 4 + 3] };
}

test("background, the model's skin, shoes and leftovers are removed automatically", () => {
  const p = studioPhoto();
  assert.ok(gf.gfExtract(p.d, p.W, p.H));
  assert.strictEqual(p.alpha(5, 5), 0, "backdrop");
  assert.strictEqual(p.alpha(26, 60), 0, "arm skin");
  assert.strictEqual(p.alpha(48, 178), 0, "ankle skin");
  assert.strictEqual(p.alpha(48, 187), 0, "shoe");
  assert.strictEqual(p.alpha(60, 30), 255, "garment kept");
  assert.strictEqual(p.alpha(50, 60), 255, "skin-coloured print inside the garment kept");
  const fit = gf.gfMeasure(p.d, p.W, p.H);
  assert.deepStrictEqual(fit.box, { x: 35, y: 25, w: 50, h: 145 }, "trimmed exactly to the garment");
});

test("a nude / peach garment is not mistaken for skin", () => {
  const p = studioPhoto([226, 176, 146]);
  assert.ok(gf.gfExtract(p.d, p.W, p.H));
  assert.strictEqual(p.alpha(60, 80), 255, "skin-toned garment kept");
});

test("necklines and halters keep their own shape above the bust", () => {
  const W = 40, H = 160, d = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) { const half = y < 30 ? 2 : 18; for (let x = 20 - half; x < 20 + half; x++) d[(y * W + x) * 4 + 3] = 255; }
  const B = makeBody({ heightCm: 165, bustCm: 90, waistCm: 72, hipsCm: 100 });
  const plan = gf.gfPlan(gf.gfMeasure(d, W, H), "upper", { ...B, modelH: 179, lengthCm: 130 });
  const neck = plan.bands.find((b) => b.y + b.h / 2 < 80), skirt = plan.bands.find((b) => b.y > 200);
  assert.ok(neck.half < 10, `halter strap should stay narrow, got ${neck.half}`);
  assert.ok(skirt.half >= gf.gfLerp(gf.GF_TORSO, skirt.y) * B.widthAt(skirt.y, B.K), "below the bust it still covers the body");
});

test("the app has no manual selection step: picking a photo puts it straight on the avatar", () => {
  assert.ok(!/garCanvas|Mark the garment|garSave|Drag a box/.test(html), "manual 'mark the garment' UI is back");
  const handler = html.slice(html.indexOf('$("#fileGarment").addEventListener'), html.indexOf("function afterRender"));
  assert.ok(/gfExtract\(/.test(handler) && /measureCanvas\(/.test(handler) && /localStorage\.setItem\("wifm-g-"/.test(handler), "the photo handler must cut out, measure and save automatically");
  assert.ok(!/go\("garment"/.test(html), "no extra screen between choosing the photo and the avatar");
});

test("length comes from the garment table even when a body table is pasted above it", () => {
  const chart = "Size | Bust | Waist | Hips\nXS | 80-84 | 62-66 | 90-94\nS | 84-88 | 66-70 | 94-98\n\nSize | Waist flat | Total length\nXS | 33 | 125\nS | 35 | 126";
  assert.strictEqual(gf.gfChartLengthCm(chart, "S"), 126);
  assert.strictEqual(gf.gfChartLengthCm(chart, "XS"), 125);
});

// ---------- Length: where the hem really lands, from the floor ----------
// Real case: Le Privé "Roseline" maxi, XS = 125 cm, thin straps. On a 158 cm customer it was
// too long; the old rule ("hem moves 0.47 cm per cm of height difference") said ~5 cm.

test("strappy maxi: length is measured from the bodice, hem lies on the floor for a 158 cm woman", () => {
  const start = gf.gfStartPoint("upper", "Thin straps, ruched neckline with tie detail, maxi length");
  assert.strictEqual(start, "bodice");
  const hem = gf.gfHemCm(125, 158, start);
  assert.ok(hem < -8, `125 cm from the bodice must lie well on the floor for 158 cm, got ${hem}`);
  assert.match(gf.gfHemWords(hem, 158), /on the floor/);
  assert.match(gf.gfHemWords(73, 158), /hips/, "a 56 cm sweater on 158 cm ends at the hips, not the knee");
  assert.ok(gf.gfHemCm(125, 168, start) > hem + 6, "on the 168 cm model it sits ~7 cm higher");
});

test("sleeved garments are measured from the shoulder; bottoms from the waistband", () => {
  assert.strictEqual(gf.gfStartPoint("upper", "Long wool coat with lapels"), "shoulder");
  assert.strictEqual(gf.gfStartPoint("bottom", "", "high"), "high");
  assert.ok(Math.abs(gf.gfHemCm(100, 165, "mid") - (0.58 * 165 - 100)) < 0.11);
});

test("the avatar draws the hem at its real height above the floor", () => {
  const W = 40, H = 300, d = new Uint8ClampedArray(W * H * 4);
  for (let i = 3; i < d.length; i += 4) d[i] = 255;
  const fit = gf.gfMeasure(d, W, H);
  const B = makeBody({ heightCm: 158, bustCm: 81, waistCm: 69, hipsCm: 99 });
  const onFloor = gf.gfPlan(fit, "upper", { ...B, lengthCm: 125, start: "bodice" });
  assert.ok(Math.abs(onFloor.y0 + onFloor.gh - 397) < 1.5, "a dress longer than the body reaches the floor on the avatar");
  const midi = gf.gfPlan(fit, "upper", { ...B, lengthCm: 95, start: "shoulder" });
  const expectHemY = 397 - gf.gfHemCm(95, 158, "shoulder") * (383 / 158);
  assert.ok(Math.abs(midi.y0 + midi.gh - expectHemY) < 0.5, "midi hem at its real height");
});

test("length facts give the hem for every size, and the app no longer uses the old % rule", () => {
  const f = gf.gfLengthFacts("Size | Waist flat | Total length\nXS | 33 | 125\nS | 35 | 126", "upper", "thin straps", "mid", 158, 168);
  assert.deepStrictEqual(f.bySize.map((r) => r.size), ["XS", "S"]);
  assert.ok(f.bySize[0].hemAboveFloorCmOnUser < -8);
  assert.ok(!/lengthShift|\* 0\.47/.test(html), "the old model-height % rule is back");
  assert.ok(/computedLength: lengthFacts/.test(html), "the verdict must get the real hem facts");
});

// ---------- Pale fabric on a white backdrop ----------
// Real case: a butter-yellow slip dress on white (Le Privé "Felice"). The background fill
// leaked into the pale fabric and cream was taken for skin, so only scraps reached the avatar.
// The shop's photo is not stored here; this synthetic one has the same traits: near-white
// backdrop with JPEG-like noise, pale yellow fabric, near-white highlight streaks that run
// to the garment's edge, small peach/pink flowers, thin straps.
function paleDress(W, H) {
  const d = new Uint8ClampedArray(W * H * 4);
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const set = (x, y, c) => { const a = (y * W + x) * 4; d[a] = c[0]; d[a + 1] = c[1]; d[a + 2] = c[2]; d[a + 3] = 255; };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const n = Math.round(rnd() * 3); set(x, y, [254 - n, 254 - n, 254 - n]); }
  const top = Math.round(H * 0.18), bot = Math.round(H * 0.95), cx = W / 2;
  const half = (y) => { const t = (y - top) / (bot - top); return W * (0.17 + 0.03 * Math.sin(t * 3) + (t > 0.7 ? (t - 0.7) * 0.25 : 0)); };
  for (let y = top; y < bot; y++) for (let x = Math.round(cx - half(y)); x < Math.round(cx + half(y)); x++) {
    const streak = Math.abs(((x + y * 0.4) % (W * 0.12)) - W * 0.06) < W * 0.006; // diagonal highlight folds
    set(x, y, streak ? [252, 251, 244] : [246, 238, 196]);
  }
  for (let i = 0; i < 160; i++) { const y = top + Math.round(rnd() * (bot - top - 6)), x = Math.round(cx - half(y) * 0.8 + rnd() * half(y) * 1.6); for (let k = 0; k < 9; k++) set(x + (k % 3), y + Math.floor(k / 3), rnd() > 0.5 ? [226, 160, 140] : [205, 150, 160]); }
  for (const sx of [cx - half(top) * 0.8, cx + half(top) * 0.8]) for (let y = Math.round(H * 0.05); y < top; y++) for (let k = 0; k < Math.max(2, W * 0.008); k++) set(Math.round(sx + k), y, [246, 238, 196]); // straps
  return d;
}
for (const [W, H] of [[800, 1199], [534, 800]]) {
  test(`pale dress on white survives the cut-out (${W}x${H})`, () => {
    const d = paleDress(W, H);
    const r = gf.gfExtract(d, W, H);
    assert.ok(r, "something must be kept");
    const f = gf.gfMeasure(d, W, H);
    assert.ok(f.box.h / H > 0.85, "from the straps down to the hem");
    const alpha = (x, y) => d[(y * W + x) * 4 + 3];
    const cx = Math.round(W / 2);
    let holes = 0, total = 0;
    for (let y = Math.round(H * 0.2); y < Math.round(H * 0.94); y += 3) for (let x = cx - Math.round(W * 0.12); x < cx + Math.round(W * 0.12); x += 3) { total++; if (!alpha(x, y)) holes++; }
    assert.ok(holes / total < 0.01, `the fabric must stay whole, ${(100 * holes / total).toFixed(1)}% was removed`);
    assert.strictEqual(alpha(5, 5), 0, "white backdrop removed");
  });
}
test("cream / butter-yellow fabric is not mistaken for skin", () => {
  const W = 60, H = 100, d = new Uint8ClampedArray(W * H * 4);
  for (let p = 0; p < W * H; p++) { const x = p % W, y = Math.floor(p / W), a = p * 4; const inG = x >= 15 && x < 45 && y >= 10 && y < 90; d.set(inG ? [240, 228, 190, 255] : [120, 120, 125, 255], a); }
  gf.gfExtract(d, W, H);
  assert.strictEqual(d[(50 * W + 30) * 4 + 3], 255);
});

test("typical length is used (and marked) when the chart has none", () => {
  assert.strictEqual(gf.gfTypicalLengthCm("bodice", "Felice midi dress, thin straps"), 108);
  assert.strictEqual(gf.gfTypicalLengthCm("shoulder", "maxi coat"), 140);
  assert.strictEqual(gf.gfTypicalLengthCm("bodice", "dress"), null);
  assert.ok(/estimated: !chartCm/.test(html) && /a typical \$\{L\.lengthCm\} cm is assumed/.test(html), "the app must say when the length is an estimate");
});

test("a shop photo read from the product page goes on the avatar by itself", () => {
  assert.ok(/photoUrl: it\.photoUrl/.test(html), "inbox item passes its photo to the check");
  assert.ok(/photoUrl: F\.photoUrl/.test(html), "the check keeps the photo");
  const auto = grab("autoGarment");
  assert.ok(/gfExtract\(/.test(auto) && /measureCanvas\(/.test(auto) && /photoOff/.test(auto), "auto try-on cuts out, measures, and respects 'use the drawing instead'");
  assert.ok(/setTimeout\(\(\) => autoGarment\(c\)/.test(html), "the check screen starts it");
});

test("a brown leather jacket laid flat keeps its sleeves (leather is not skin without a model)", () => {
  const W = 200, H = 150, d = new Uint8ClampedArray(W * H * 4);
  const set = (x, y, c) => d.set([...c, 255], (y * W + x) * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) set(x, y, [246, 246, 246]);
  for (let y = 20; y < 110; y++) for (let x = 50; x < 150; x++) set(x, y, (x + y) % 7 ? [104, 85, 78] : [81, 58, 52]); // body
  for (let y = 25; y < 125; y++) { for (let x = 10; x < 46; x++) set(x, y, [104, 85, 78]); for (let x = 154; x < 190; x++) set(x, y, [104, 85, 78]); } // sleeves held out, a gap to the body
  for (let y = 25; y < 30; y++) { for (let x = 46; x < 50; x++) set(x, y, [104, 85, 78]); for (let x = 150; x < 154; x++) set(x, y, [104, 85, 78]); } // shoulders join them
  assert.ok(gf.gfExtract(d, W, H));
  const alpha = (x, y) => d[(y * W + x) * 4 + 3];
  assert.strictEqual(alpha(25, 80), 255, "left sleeve kept");
  assert.strictEqual(alpha(170, 80), 255, "right sleeve kept");
  assert.strictEqual(alpha(48, 80), 0, "gap between sleeve and body removed");
});

test("check lists show the item's own photo; shop photos for older checks come from a separate document", () => {
  assert.ok(/\$\{checkThumb\(c\)\}/.test(html), "recent checks / wishlist rows use the item photo");
  assert.ok(/it\.photoUrl \? `<img class="thumb photo"/.test(html), "inbox rows show the shop photo");
  assert.ok(/"\/photos"\)\.onSnapshot/.test(html) && /function photoUrlFor/.test(html), "photos added later are read from data/users/<id>/photos");
});

test("recent checks are paginated, 20 per page", () => {
  assert.ok(/const CHECKS_PER_PAGE = 20;/.test(html));
  assert.ok(/recentPage\(\)/.test(html) && /data-a="recentGo"/.test(html));
});
