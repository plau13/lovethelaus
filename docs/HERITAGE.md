# Heritage and story — what makes a Kitchen recipe different

The interview script ([`kitchen/docs/mom-interview.md`](../kitchen/docs/mom-interview.md)) and the onboarding questions show the real job: preserving a family's cooking so it cannot be lost. Competitors treat a recipe as data. Kitchen treats it as an heirloom with provenance.

## Data model (already in the schema)

| Table / column | Purpose |
|---|---|
| `person` | A family member who may not have an account: `name`, `relationship`, `birthYear`, `passedYear`, `photoKey`, `bio`, optional `linkedUserId`. Owned by the user who created it. |
| `recipe.originPersonId` | "From Grandma Rose". |
| `recipe.adaptedFromRecipeId` | Lineage chain: this recipe was adapted from another recipe in the family. |
| `recipe.story` | Free text: where this recipe comes from. |
| `recipe.firstMadeYear`, `recipe.occasion` | "First made 1974", "Thanksgiving". |
| `recipe.slug` | Public URL for Phase 2. |
| `recipe_media` | `kind` = `photo` / `scan` / `voice`, R2 key, caption, duration, position. Scanned handwritten cards and voice memos are first-class. |
| `recipe_memory` | "I made this": `madeOn`, note, optional media. Feeds the timeline. |
| `cookbook.dedication`, `cookbook.familyName` | The cookbook reads like a book. |

## UI, in priority order (Phase 3)

1. **Provenance block** at the top of the recipe page: "From Grandma Rose · first made 1974 · adapted from Rose's original by Mom in 2003". Lineage renders as a breadcrumb of linked recipes. The editor gets a "Where it comes from" card: person picker (create inline), story textarea, year, occasion.
2. **Scanned card.** Upload a photo of the handwritten card; it shows as a flip-able "original" beside the typed version. Later: AI transcription into a draft (`import-ai.ts` already has the structuring prompt; add a vision input).
3. **Voice memo.** Record in-browser (`MediaRecorder`), store to R2, play inline on the recipe and in cook mode ("hear Grandma explain step 4"). Free tier: one per recipe; Plus: unlimited.
4. **Family timeline** at `/family` (replaces the `/loved-ones` redirect). People, their recipes, and `recipe_memory` entries in a scrolling timeline; "I made this" on cook-mode completion.
5. **Cookbook as a book.** Dedication page, cover, chapters by occasion, a "Contributors" page generated from people. The public `/c/[slug]` uses the same structure, which is what makes public pages worth indexing and sharing.
6. **Print-ready PDF** of a cookbook (Plus upsell) reuses the book structure.

## Tone

Plain, warm, family-member voice per [`BRAND.md`](BRAND.md). Labels are "Where it comes from", "Made this", "The original card", never "metadata", "attachments", or "assets".
