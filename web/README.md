# Will It Fit Me — the working app (Claude artifact)

`will-it-fit-me.html` is the source of the live app published in Claude.
Republish it from this file after every change.

## Rule: shop photos are fitted to the user's body

A shop photo of a garment must **never** be pasted on the avatar as a plain rectangle.
All photo try-on goes through `fitPhoto()` → `gfPlan()` / `gfSVG()` (the code in `garment-fit.js`, embedded verbatim in the HTML):

1. The cut-out is trimmed to the garment and its outline is measured row by row (`gfMeasure`).
2. Each row is redrawn at the width it would have on *this* body at that height
   (shoulders, bust, waist, hips, thighs, calves from the profile), never narrower than the body, keeping the garment's own shape (flare, sleeves, wide legs).
3. Length comes from the size chart's total length for the recommended size, converted by the user's height; without a chart, from the photo re-scaled from the model's height.

Before publishing, run:

```
node --test web/test/
```

The tests fail if the HTML stops using the fitter, drifts from `garment-fit.js`, or if the garment stops following the body.
