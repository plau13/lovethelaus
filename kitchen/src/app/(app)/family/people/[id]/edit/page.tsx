import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePersonAction } from "@/app/actions/people";
import { PersonForm } from "@/components/PersonForm";
import { requireOnboardedUser } from "@/lib/auth";
import { getPerson } from "@/lib/people";

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireOnboardedUser();
  const { id } = await params;
  const person = await getPerson(id, user.id);
  if (!person) {
    notFound();
  }
  return (
    <main className="grid gap-6">
      <p className="text-muted">
        <Link href={`/family/people/${person.id}`}>← {person.name}</Link>
      </p>
      <h1 className="font-serif text-4xl">Edit {person.name}</h1>
      <PersonForm
        action={updatePersonAction}
        submitLabel="Save changes"
        hidden={{ personId: person.id }}
        defaults={{ name: person.name, relationship: person.relationship, birthYear: person.birthYear, passedYear: person.passedYear, bio: person.bio }}
      />
    </main>
  );
}
