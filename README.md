# Lavender Spa & Boutique — website redesign

A fast, fully static redesign of [lavenderspa.ca](https://www.lavenderspa.ca/) for Lavender Spa & Boutique, 275 Erie St S, Leamington, ON.

No build step and no frameworks: plain HTML, one stylesheet and one script. Open `index.html` or host the folder on any static host (Netlify, GitHub Pages, Cloudflare Pages, etc.).

## Pages
| File | Content |
| --- | --- |
| `index.html` | Hero, treatment categories, signature treatments, why us, booking steps, boutique teaser |
| `services.html` | Full spa menu with filter tabs (deep-linkable, e.g. `services.html#nails`) |
| `about.html` | Story, values, unique experiences |
| `products.html` | Boutique and gift cards |
| `contact.html` | Contact details, live hours, booking request form, map, FAQ |

## Design system
All colours, gradients, radii and shadows are CSS variables at the top of `assets/css/styles.css` (`--grad-brand`, `--grad-dusk`, `--grad-soft`, `--grad-text`, …), so the palette stays consistent everywhere.

## Interactions (`assets/js/main.js`)
- Live "Open now / Closed · opens …" status in Leamington time (edit `HOURS` at the top)
- Scroll reveals, animated headline, counters, 3D card tilt, falling-petal hero canvas (paused off-screen)
- Sticky glass header, scroll progress bar, back-to-top ring, mobile booking bar, animated mobile menu
- Booking form opens the visitor's email app with a prefilled request to lavenderspa@gmail.com; `?service=` preselects a treatment
- Respects `prefers-reduced-motion`; keyboard and screen-reader friendly

## Before going live
- Prices marked **"Call for pricing"** weren't publicly listed; fill them in on `services.html`.
- Photos are free Unsplash stock images (see `assets/img/CREDITS.md`). Swap them for photos of the actual spa when available: keep the same file names, or update the `<img>` tags in `.hero__arch`, `.frame`, `.category-card__art` and `.product__art`.
- To use an online booking system, point the "Book" links (`contact.html#book`) at its URL.
