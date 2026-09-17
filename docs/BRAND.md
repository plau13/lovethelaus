# Love the Laus — Brand guidelines

Shared visual and voice standards for the **marketing site** (Astro, repo root) and **Kitchen** (Next.js, `/kitchen`). Keep both surfaces aligned when adding UI.

## Brand voice

- **What we are:** A family recipe box that cannot get discontinued — warm, durable, personal.
- **Tone:** Plain language, confident but not corporate. Write like a helpful family member, not a SaaS landing page.
- **Avoid:** Cold blues/slates, jargon (“workspace”, “platform”), hype without substance.

## Color palette

### Light mode (primary)

| Token     | Hex       | CSS variable                                 | Usage                  |
| --------- | --------- | -------------------------------------------- | ---------------------- |
| Paper     | `#faf6f0` | `--color-paper` / `--aw-color-bg-page`       | Page background        |
| Ink       | `#2c1810` | `--color-ink` / `--aw-color-text-default`    | Body text, headings    |
| Muted     | `#6b5348` | `--color-muted` / `--aw-color-text-muted`    | Secondary text, labels |
| Clay      | `#8b3a2a` | `--color-clay` / `--aw-color-primary`        | Primary actions, links |
| Clay dark | `#6e2c20` | `--color-clay-dark` / `--aw-color-secondary` | Hover states           |
| Line      | `#e6d8cc` | `--color-line` / `--aw-color-line`           | Borders, dividers      |

### Dark mode (marketing)

| Token                                       | Usage                          |
| ------------------------------------------- | ------------------------------ |
| `--aw-color-bg-page: rgb(44 24 16)`         | Dark page background           |
| `--aw-color-text-default: rgb(250 246 240)` | Light text                     |
| `--aw-color-primary: rgb(196 120 100)`      | Links and accents in dark mode |

Kitchen app is light-mode first; marketing supports dark via `.dark` class.

## Typography

| Role                     | Font               | Where                                                       |
| ------------------------ | ------------------ | ----------------------------------------------------------- |
| Headings & recipe titles | **Source Serif 4** | `font-serif`, `--font-serif`, `--aw-font-heading`           |
| UI & body                | **Source Sans 3**  | `font-sans`, `--font-sans`, `--aw-font-sans`                |
| Base size (Kitchen)      | 18px               | `html { font-size: 18px }` in `kitchen/src/app/globals.css` |

Use serif for recipe names and page titles; sans for navigation, forms, and metadata.

## Logo and icon

- **Mark:** Outline chef hat (terracotta stroke on transparent background).
- **Marketing favicon:** `src/assets/favicons/favicon.svg` → also `public/favicon.svg`
- **Kitchen icon:** `kitchen/public/icon.svg`, `kitchen/src/app/icon.svg`
- **Production paths:** `/favicon.svg`, `/kitchen/icon.svg`

Do not use filled or blue variants. Keep the hat outline consistent across surfaces.

## UI patterns

### Primary action

- Background: clay (`bg-clay` or `@utility btn-clay`)
- Text: **white** (`#fff`) — never clay text on clay background
- Min height: 48px (`min-h-12`, `.btn`)
- Border radius: `rounded-xl` (0.75rem)

```html
<!-- Link -->
<a class="btn-clay btn-clay-hover ...">Add recipe</a>

<!-- Button -->
<button class="btn rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark"></button>
```

Global fix in `kitchen/src/app/globals.css`: `a.bg-clay`, `a.btn-clay`, and `button.bg-clay` force white text.

### Secondary action

- White background, `border border-line`, clay text on hover

### Cards

- `rounded-2xl border border-line bg-white p-4` (or `p-5` for sections)
- **Recipe list card** (`RecipeListItem`): `rounded-xl border border-line bg-white p-4 shadow-sm`; serif title + muted metadata line (category · cook time · difficulty · tags), always visible
- **Cookbook list card** (`CookbookListItem`): same shell; title + visibility · recipe count · role
- **Recipe detail toolbar**: `← All recipes` and bordered **Cook mode Off/On** on one line (grey rectangle when off, green when on); **Heart · Share · Download · ⋯** icon buttons on the right (48px, centered icons); Share opens invite/copy modal; cook On uses inline `KitchenView`
- **Recipe detail sections**: `rounded-2xl border border-line bg-white p-5` cards for Ingredients and Instructions; uppercase section labels
- **Servings control** (`ServingsControl`): stepper below title; scales ingredient quantities client-side (best-effort for lines with leading numbers/fractions)
- **Recipe photo**: hero image above ingredients when uploaded; dashed placeholder with edit link when missing (editors only)

### Heritage (“Where it comes from”)

- **Provenance card** (`ProvenanceBlock`): white card, uppercase `text-xs` label “Where it comes from”, provenance line in **serif `text-2xl`** (“From Grandma Rose (grandmother) · first made 1974 · Sunday dinner”), story in `text-lg leading-relaxed`, lineage lines in `text-muted`. Editors see a dashed paper card with an “Add it” link when empty.
- **Editor card** (`ProvenanceFields`): same shell as other editor sections; person select with an inline “+ Add someone” mini-form; all fields optional.
- **Made this** (`MadeThisButton`): secondary (white, `border-line`) button with a ✓; expands into a date + note form. Never clay: it is a memory, not a primary action.
- **Family timeline** (`/family`): people as cards (serif name, muted relationship · years · recipe count); timeline as a left-bordered list with clay dots.

### Photos

- **Gallery** (`PhotoGallery`): a two-column grid of white cards on the recipe page, cover first and labelled "Cover". Each card carries the photo, its description, and, for editors, "Make this the cover" and "Remove" as quiet text links rather than buttons.
- **Cover** is what leads the recipe page, the cookbook card and the social preview. It is chosen, never the oldest upload.
- **Empty state**: "No photos yet. The first one you add becomes the cover."

### Heritage media

- **“The original card”** (`ScanPanel`): the scan sits beside the typed recipe in the standard white card, never cropped — a handwritten card has to stay legible. Caption in `text-sm text-muted` under the image.
- **“In their own voice”** (`VoicePlayer`): a full-width native `<audio controls>` with the caption and duration beside it. In cook mode it pins above the ingredients under “Hear how they made it”.
- **Recorder** (`VoiceRecorder`): secondary button to start, clay-free stop and an elapsed timer, then a preview before saving. A plain file input is always offered as a fallback.
- **Upgrade nudge**: one muted line in place of the upload control (“Free accounts keep 1 card photo per recipe. Kitchen Plus adds as many as you like.”). Never a modal, never a banner.

### The printed book (`/cookbooks/[id]/book`)

- Cover is centered: family name in uppercase `text-xs`, book title in serif `text-5xl`, dedication in serif italic, recipe count and keeper in muted small type.
- Contributors page reuses the family-card wording: name, relationship, years, recipe count.
- One recipe per printed page, each opening with a small-caps running head of the book title; chapters are announced above the first recipe of the chapter rather than on their own page, so no blank leaves.
- Print rules live in `book.css`: letter page, 0.75in margins, `break-after: page` on the cover, contributors and each recipe, `break-inside: avoid` on ingredients and steps.

### Auth screens

- Kitchen: `AuthShell` component (`kitchen/src/components/AuthShell.tsx`)
- Marketing: `AuthLayout.astro` (`src/layouts/AuthLayout.astro`)
- Centered card, clay primary button, footer links below form

### Touch targets

Minimum **48px** height for buttons and primary taps (kitchen counter / phone use).

## Layout

| Area               | Max width                       |
| ------------------ | ------------------------------- |
| Kitchen content    | `max-w-3xl`                     |
| Kitchen header     | `max-w-4xl`                     |
| Marketing sections | `max-w-7xl` (AstroWind default) |

Kitchen nav: logo left, **Home · Recipes · Cookbooks · Family** centered, user menu right.

## Do / Don't

| Do                                                            | Don't                                              |
| ------------------------------------------------------------- | -------------------------------------------------- |
| Use clay + white for primary CTAs                             | Put clay-colored link text on clay buttons         |
| Match marketing and Kitchen warm palette                      | Introduce blue, slate, or generic Bootstrap colors |
| Use serif for recipe titles                                   | Use all-caps system fonts for headings             |
| Test light and dark on marketing auth pages                   | Assume Kitchen dark mode exists (it doesn't yet)   |
| Link to [`docs/TESTING.md`](TESTING.md) when changing auth UI | Fix one auth flow without checking the full matrix |

## File reference

| What to change                | File                                                               |
| ----------------------------- | ------------------------------------------------------------------ |
| Kitchen colors & utilities    | `kitchen/src/app/globals.css`                                      |
| Marketing colors (light/dark) | `src/components/CustomStyles.astro`                                |
| Marketing Tailwind theme      | `src/assets/styles/tailwind.css`                                   |
| Kitchen fonts                 | `kitchen/src/app/layout.tsx` (next/font)                           |
| Marketing fonts               | `astro.config.ts` → `Layout.astro`                                 |
| Favicon (marketing)           | `src/assets/favicons/favicon.svg`, `src/components/Favicons.astro` |
| Favicon (Kitchen)             | `kitchen/public/icon.svg`, `kitchen/src/app/layout.tsx` metadata   |

When adding a new color or pattern, update **this document** and both code locations if the change applies to both surfaces.
