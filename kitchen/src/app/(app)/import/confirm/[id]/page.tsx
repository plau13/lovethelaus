import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { confirmImport } from "@/app/actions/import";
import { QueryFlash } from "@/components/QueryFlash";
import { RecipeEditor } from "@/components/RecipeEditor";
import { getDb, schema } from "@/db/client";
import { requireOnboardedUser } from "@/lib/auth";

export default async function ConfirmImportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireOnboardedUser();
  const [{ id }, { error }] = await Promise.all([params, searchParams]);
  const db = getDb();
  const draft = await db.query.importDraft.findFirst({
    where: and(eq(schema.importDraft.id, id), eq(schema.importDraft.userId, user.id)),
  });
  if (!draft) {
    notFound();
  }
  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Check this draft</h1>
      <QueryFlash error={error} />
      <p className="text-muted">Fix anything that looks wrong, then save. Source stays {draft.sourceUrl}.</p>
      <RecipeEditor
        saveAction={confirmImport}
        submitLabel="Save to my box"
        defaultServings={user.defaultServings}
        hiddenFields={{ draftId: draft.id }}
        defaults={{
          title: draft.title,
          ingredients: draft.ingredients,
          steps: draft.steps,
          attribution: draft.attribution,
        }}
      />
    </main>
  );
}
