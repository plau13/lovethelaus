import { notFound } from "next/navigation";
import { confirmImport } from "@/app/actions/import";
import { RecipeEditor } from "@/components/RecipeEditor";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ConfirmImportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const draft = await prisma.importDraft.findFirst({
    where: { id, userId: user.id },
  });
  if (!draft) {
    notFound();
  }
  return (
    <main className="grid gap-6">
      <h1 className="font-serif text-4xl">Check this draft</h1>
      <p className="text-muted">
        Fix anything that looks wrong, then save. Source stays {draft.sourceUrl}.
      </p>
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
