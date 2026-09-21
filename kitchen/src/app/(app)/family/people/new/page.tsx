import Link from "next/link";
import { savePerson } from "@/app/actions/people";
import { PersonForm } from "@/components/PersonForm";
import { QueryFlash } from "@/components/QueryFlash";
import { requireOnboardedUser } from "@/lib/auth";

export default async function NewPersonPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  await requireOnboardedUser();
  return (
    <main className="grid gap-6">
      <p className="text-muted">
        <Link href="/family">← Family</Link>
      </p>
      <h1 className="font-serif text-4xl">Add a person</h1>
      <QueryFlash error={error} />
      <p className="text-muted">Someone your recipes come from. They do not need a Kitchen account.</p>
      <PersonForm action={savePerson} submitLabel="Save person" />
    </main>
  );
}
