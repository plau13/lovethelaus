# Love the Laus — Agent Instructions

**Family recipe product lives in [`kitchen/`](kitchen/).** This repo root is the **Love the Laus marketing site** (Astro). Do not turn it into the recipe app. See [`kitchen/AGENTS.md`](kitchen/AGENTS.md) for the Kitchen app.

## Agent execution

**Always run terminal commands yourself** — installs, builds, tests, migrations, seeds, git, and dev servers. Do not tell the user to run a command you can run unless the environment blocks you (missing credentials, permissions, interactive prompts, or external services only the user can access). If a command fails, diagnose and retry or try an alternative before handing off.

Applies to the whole repo (root marketing site and `kitchen/`).

### Commit and deploy (default)

**After completing a task, commit and deploy unless the user says otherwise** (e.g. “don’t commit”, “local only”, “draft”).

1. **Verify** — run the checklist below (`build`, `check` where applicable).
2. **Commit** — stage relevant changes only; never commit `.env`, secrets, or `.wrangler/` state. Write a concise commit message focused on why.
3. **Deploy** — push to production using the smallest scope that covers your changes:

| What changed | Deploy command (from repo root) |
|--------------|----------------------------------|
| Marketing site only (`src/`, `dist/`, Astro) | `npm run deploy:router` |
| Kitchen only (`kitchen/`) | `cd kitchen && npm run deploy` |
| Both, or unsure | `npm run deploy:all` |

Requires `wrangler login` and Cloudflare access. See [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md).

If deploy is blocked (missing credentials, failed build), commit anyway when possible and report what blocked deploy.

## Project Overview

Static marketing site built on **Astro v7** and **Tailwind CSS v4** (AstroWind template base). Pages: home (`/`), privacy, terms, 404. Landing CTAs link to Kitchen via `PUBLIC_KITCHEN_URL`.

**Stack:** Astro v7 | Tailwind CSS v4 | TypeScript 5.9 | MDX | Sharp

## Quick Reference

| Command           | Purpose                             |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Start dev server at localhost:4321  |
| `npm run build`   | Production build to `./dist/`       |
| `npm run preview` | Preview production build locally    |
| `npm run check`   | Run astro check + ESLint + Prettier |
| `npm run fix`     | Auto-fix ESLint + Prettier issues   |

**Node.js requirement:** >= 22.12.0

## Architecture

### Directory Structure

```
src/
  assets/styles/tailwind.css   # Tailwind v4 config (themes, utilities, plugins)
  components/
    common/        # Shared: Image, Metadata, Analytics, ToggleTheme
    ui/            # Primitives: Button, Form, Headline, Timeline, WidgetWrapper
    widgets/       # Page sections: Hero, Features, Steps, Header, Footer
    CustomStyles.astro  # CSS variables for colors and fonts
  content.config.ts    # Content collections (empty — blog removed)
  layouts/             # Layout.astro, PageLayout.astro, MarkdownLayout.astro
  pages/               # index.astro, privacy.md, terms.md, 404.astro
  utils/               # images.ts, permalinks.ts, frontmatter.ts
  config.yaml          # Site configuration (loaded as virtual module)
  navigation.ts        # Navigation structure
  types.d.ts           # TypeScript type definitions
vendor/integration/    # Custom Astro integration for config loading
```

### Path Aliases

Use `~/` to import from `src/`:

```typescript
import Image from '~/components/common/Image.astro';
import { SITE } from 'astrowind:config';
```

### Configuration System

Site config lives in `src/config.yaml` and is loaded as a Vite virtual module `astrowind:config` by the custom integration in `vendor/integration/`. Exports: `SITE`, `I18N`, `METADATA`, `APP_BLOG`, `UI`, `ANALYTICS`.

## Tailwind CSS v4

Configuration is CSS-first in `src/assets/styles/tailwind.css`:

- **Theme tokens:** `@theme { --color-primary: var(--aw-color-primary); ... }`
- **Custom utilities:** `@utility bg-page { ... }`
- **Dark mode:** Class-based via `@variant dark (&:where(.dark, .dark *))`
- **Plugins:** `@plugin "@tailwindcss/typography"`
- **Custom variant:** `@custom-variant intersect (&:not([no-intersect]))`

CSS variables for colors/fonts are defined in `src/components/CustomStyles.astro` with light/dark theme variants.

The Vite plugin `@tailwindcss/vite` is configured in `astro.config.ts` (not as an Astro integration).

### Class Merging

Components use `twMerge` from `tailwind-merge` v3 for conditional class composition.

## Content Collections

`src/content.config.ts` exports empty collections. Blog and RSS were removed; do not re-add without a product reason.

## Kitchen URL

Landing and nav use `import.meta.env.PUBLIC_KITCHEN_URL ?? 'http://localhost:3000/kitchen'`. Document in root `.env.example`.

## Component Patterns

- Props extend interfaces from `~/types`
- Use `class:list` for conditional classes
- Use `twMerge()` when accepting className overrides
- Use named slots for layout composition
- Widget components accept standardized props (see `~/types`)

## Image Handling

`src/components/common/Image.astro` supports:

- Local images via `astro:assets` (optimized by Sharp)
- Remote images via Unpic CDN
- Allowed domains (for providers Unpic can't detect, processed by Sharp): `cdn.pixabay.com`

Hero images use `loading="eager"` and `fetchpriority="high"`.

## Fonts

Fonts are handled by Astro's native **Fonts API**, configured in `astro.config.ts` under the `fonts` key (provider, family, `cssVariable`) and injected via the `<Font />` component in `src/layouts/Layout.astro`. Astro self-hosts, subsets, preloads, and generates metric-adjusted fallbacks. To change the typeface, edit the `fonts` entry and point `--aw-font-*` in `CustomStyles.astro` at the new `cssVariable`.

## Third-party Scripts (Partytown)

`@astrojs/partytown` is wired as an **opt-in** in `astro.config.ts`, gated behind `const hasExternalScripts = false`. Set it to `true` to offload third-party scripts (e.g. Google Analytics via `analytics.vendors.googleAnalytics.partytown`) to a web worker. It is disabled by default so the base template ships no external scripts.

## Content Security Policy

Astro's native CSP is intentionally **not** enabled in this version: it is incompatible with `<ClientRouter />` view transitions (shipped on by default) and would break the arbitrary third-party scripts a template user typically adds. CSP is deferred to AstroWind v2, where the component model (and optional SSR) make it clean and opt-in.

## Verification Checklist

After changes, run the relevant section in [`docs/TESTING.md`](docs/TESTING.md). **Auth/email changes require the full Auth & email matrix** — not just the flow you edited.

Design changes should follow [`docs/BRAND.md`](docs/BRAND.md).

Default automated checks:

1. `npm run build` succeeds (or `npm run build:prod` + `npm run check` if marketing changed)
2. `cd kitchen && npm run build` when Kitchen changed
3. Visual check per [`docs/TESTING.md`](docs/TESTING.md) for the domains touched
