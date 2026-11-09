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
