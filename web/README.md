# Will It Fit Me — the working app (Claude artifact)

`will-it-fit-me.html` is the source of the live app published in Claude.
Republish it from this file after every change.

## Rule: choosing a shop photo is the only step

The user picks a product photo and it goes straight onto the avatar. There is **no**
"mark the garment" / crop / draw-a-box step. `gfExtract` removes the studio background,
the model's skin (face, neck, arms, legs) and leftovers (hair, shoes) automatically,
keeps skin-coloured prints and nude/peach garments, and `measureCanvas` trims to the garment.

## Rule: shop photos are fitted to the user's body

A shop photo of a garment must **never** be pasted on the avatar as a plain rectangle.
All photo try-on goes through `fitPhoto()` → `gfPlan()` / `gfSVG()` (the code in `garment-fit.js`, embedded verbatim in the HTML):

1. The cut-out is trimmed to the garment and its outline is measured row by row (`gfMeasure`).
2. Each row is redrawn at the width it would have on *this* body at that height
   (shoulders, bust, waist, hips, thighs, calves from the profile): the photographed shape at true scale, widened where the body is wider, never narrower than the body where it must cover it (bust down; everywhere for bottoms). Necklines, halters and straps keep their own shape.
3. Length comes from the size chart's total length for the recommended size, converted by the user's height; without a chart, from the photo re-scaled from the model's height.

Before publishing, run:

```
node --test web/test/
```

The tests fail if a manual selection step comes back, if the cut-out stops removing background/skin, if the HTML stops using the fitter, drifts from `garment-fit.js`, or if the garment stops following the body.
