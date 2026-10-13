---
published: false
---

# Storm response pages

NTX Hail uses one hidden page per hail event. These pages use the same header, footer, chat widget, and blue ticker as the rest of the site. Do not add them to the navigation or the footer. People reach a storm page only from a link you share.

`storm/_template/` is the copy source. GitHub Pages does not publish folders whose names start with `_`, so the template is not a public URL.

`storm/sample-hail-storm/` is a filled preview and is marked `noindex`. Do not treat it as a live storm.

## Make a new storm page

1. Copy the folder `storm/_template/` to `storm/your-storm-name/` (lowercase, words separated by hyphens). Example: `storm/april-15-north-dallas/`.
2. Open `index.html` in the new folder and replace:
   - `{Month Day}` and `{City/Area}` in the `<title>` and the H1
   - `{DATE}`, `{AREAS}`, and `{MAX_HAIL_SIZE}` in the storm summary
3. Rewrite the short lead sentence so it describes that storm. Keep the vehicle checklist (hood, roof, trunk, both sides, glass), the paintless dent repair explanation, and the deductible language.
4. Do not promise to waive, pay, or rebate a deductible. The deductible remains the customer's responsibility. That kind of offer is illegal in Texas, and NTX Hail does not make it in any state.
5. Leave the three buttons as they are: green **Get a Photo Estimate** (`/estimate/`), **Contact Us** (scrolls to the embedded contact form), and **Back to Homepage** (`/`).
6. Do not add a link to the new page in the header, mobile menu, or footer.
7. Real storm pages should be indexable. The template has no `noindex` tag. Do not copy the `noindex` tag from `storm/sample-hail-storm/`.
8. A sitemap entry can be added later. Do not add one until you mean for the page to be indexed.

The page will be at `https://www.ntxhail.com/storm/your-storm-name/` after it is merged to `main`.

## Retire an old storm page

When an event page should come down, keep the URL and replace `storm/your-storm-name/index.html` with a redirect to the homepage. Deleting the file makes the old link a 404. The redirect uses both a meta refresh and JavaScript, same idea as the estimate thank-you page, but it sends people home immediately.

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="robots" content="noindex">
<meta http-equiv="refresh" content="0;url=https://www.ntxhail.com/">
<title>NTX Hail</title>
<link rel="canonical" href="https://www.ntxhail.com/">
<script>window.location.replace("https://www.ntxhail.com/");</script>
</head>
<body>
<p><a href="https://www.ntxhail.com/">Back to the NTX Hail homepage</a></p>
</body>
</html>
```
