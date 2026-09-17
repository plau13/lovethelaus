const inputClass = "rounded-xl border border-line bg-white px-3 py-3";

export type PersonFormValues = {
  name?: string;
  relationship?: string | null;
  birthYear?: number | null;
  passedYear?: number | null;
  bio?: string;
};

export function PersonForm({
  action,
  submitLabel,
  defaults,
  hidden,
}: {
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  defaults?: PersonFormValues;
  hidden?: Record<string, string>;
}) {
  return (
    <form action={action} className="grid gap-4 rounded-2xl border border-line bg-white p-5">
      {hidden ? Object.entries(hidden).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />) : null}
      <label className="grid gap-1">
        <span className="font-medium">Name</span>
        <input name="name" required defaultValue={defaults?.name ?? ""} placeholder="Grandma Rose" className={inputClass} />
      </label>
      <label className="grid gap-1">
        <span className="font-medium">Relationship</span>
        <input name="relationship" defaultValue={defaults?.relationship ?? ""} placeholder="grandmother, neighbour, Dad's best friend" className={inputClass} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-medium">Born (year)</span>
          <input name="birthYear" inputMode="numeric" pattern="[0-9]{4}" defaultValue={defaults?.birthYear ?? ""} className={inputClass} />
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Passed (year, if so)</span>
          <input name="passedYear" inputMode="numeric" pattern="[0-9]{4}" defaultValue={defaults?.passedYear ?? ""} className={inputClass} />
        </label>
      </div>
      <label className="grid gap-1">
        <span className="font-medium">About them</span>
        <textarea name="bio" rows={4} defaultValue={defaults?.bio ?? ""} placeholder="What they cooked, how they cooked, what the kitchen smelled like." className={inputClass} />
      </label>
      <button type="submit" className="btn w-fit rounded-xl bg-clay px-5 py-3 text-white hover:bg-clay-dark">
        {submitLabel}
      </button>
    </form>
  );
}
