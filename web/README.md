# Will It Fit Me — the working app (Claude artifact)

`will-it-fit-me.html` is the source of the live app published in Claude.
Republish it from this file after every change.

## Rule: choosing a shop photo is the only step

The user picks a product photo and it goes straight onto the avatar. There is **no**
"mark the garment" / crop / draw-a-box step. `gfExtract` removes the studio background,
the model's skin (face, neck, arms, legs) and leftovers (hair, shoes) automatically,
keeps skin-coloured prints and nude/peach garments, and `measureCanvas` trims to the garment.

## Rule: reading a product link also brings the product photo

When Claude reads a product link for the app, it also saves the main product photo (front
view, ideally a flat-lay / plain-background shot) to the app's own file store and puts its
`/_blob/<id>` url in the inbox item as `photoUrl`. The check keeps it (`input.photoUrl`) and
`autoGarment()` puts it on the avatar automatically — same cut-out and fitting as a photo the
user picks. "Use the drawing instead" sets `input.photoOff` so it is not re-applied.

The cut-out must keep pale fabric on white backdrops: the backdrop tolerance adapts to how
much the backdrop varies, the fill runs on an eroded mask so it cannot leak through near-white
highlights, and skin needs a clear red cast (cream / butter yellow is not skin).
When the chart has no length, a typical length for the named style (mini/knee/midi/maxi) is
used and the app says it is an estimate.

## Rule: shop photos are fitted to the user's body

A shop photo of a garment must **never** be pasted on the avatar as a plain rectangle.
All photo try-on goes through `fitPhoto()` → `gfPlan()` / `gfSVG()` (the code in `garment-fit.js`, embedded verbatim in the HTML):

1. The cut-out is trimmed to the garment and its outline is measured row by row (`gfMeasure`).
2. Each row is redrawn at the width it would have on *this* body at that height
   (shoulders, bust, waist, hips, thighs, calves from the profile): the photographed shape at true scale, widened where the body is wider, never narrower than the body where it must cover it (bust down; everywhere for bottoms). Necklines, halters and straps keep their own shape.
3. Length comes from the size chart's total length for the recommended size, converted by the user's height; without a chart, from the photo re-scaled from the model's height.

## Rule: length is where the hem lands above the floor

Never estimate length as "the model's hem moved by some % of the height difference".
A garment's total length starts at a point on the body (`GF_START`: shoulder, bodice top for
strappy / halter / strapless dresses, or the waistband for bottoms) whose height is a fixed share
of the wearer's height. The hem sits at `start height − length` above the floor, for the user and
the model alike. The verdict gets these numbers per size (`computedLength`), the avatar draws the
hem there, and the size she actually bought (fit feedback) is used when known.
Real case behind this rule: Le Privé "Roseline" XS, 125 cm, on a 158 cm customer — the old rule
said ~5 cm longer than on the model; in reality it lay ~11 cm on the floor.

Before publishing, run:

```
node --test web/test/
```

The tests fail if a manual selection step comes back, if the cut-out stops removing background/skin, if the HTML stops using the fitter, drifts from `garment-fit.js`, or if the garment stops following the body.
