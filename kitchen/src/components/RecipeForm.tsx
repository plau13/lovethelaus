export function RecipeForm({
  action,
  defaults,
  submitLabel,
  hiddenFields,
}: {
  action: (formData: FormData) => Promise<void>;
  defaults?: {
    title?: string;
    ingredients?: string;
    steps?: string;
    tags?: string;
    servings?: number | null;
    attribution?: string;
  };
  submitLabel: string;
  hiddenFields?: Record<string, string>;
}) {
  return (
    <form action={action} className="grid gap-5" encType="multipart/form-data">
      {hiddenFields
        ? Object.entries(hiddenFields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <label className="grid gap-1">
        <span className="font-medium">Name</span>
        <input
          name="title"
          required
          defaultValue={defaults?.title ?? ""}
          className="rounded-xl border border-line bg-white px-3 py-3"
        />
      </label>
      <label className="grid gap-1">
        <span className="font-medium">Ingredients (one per line)</span>
        <textarea
          name="ingredients"
          rows={8}
          defaultValue={defaults?.ingredients ?? ""}
          className="rounded-xl border border-line bg-white px-3 py-3"
        />
      </label>
      <label className="grid gap-1">
        <span className="font-medium">Steps (one per line)</span>
        <textarea
          name="steps"
          rows={8}
          defaultValue={defaults?.steps ?? ""}
          className="rounded-xl border border-line bg-white px-3 py-3"
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="font-medium">Tags</span>
          <input
            name="tags"
            defaultValue={defaults?.tags ?? ""}
            placeholder="chicken, weeknight"
            className="rounded-xl border border-line bg-white px-3 py-3"
          />
        </label>
        <label className="grid gap-1">
          <span className="font-medium">Servings</span>
          <input
            name="servings"
            type="number"
            min={1}
            defaultValue={defaults?.servings ?? ""}
            className="rounded-xl border border-line bg-white px-3 py-3"
          />
        </label>
      </div>
      {defaults?.attribution !== undefined ? (
        <label className="grid gap-1">
          <span className="font-medium">Source / attribution</span>
          <input
            name="attribution"
            defaultValue={defaults.attribution}
            className="rounded-xl border border-line bg-white px-3 py-3"
          />
        </label>
      ) : null}
      <label className="grid gap-1">
        <span className="font-medium">Photo (optional)</span>
        <input name="photo" type="file" accept="image/jpeg,image/png,image/webp" />
      </label>
      <button
        type="submit"
        className="btn rounded-xl bg-clay px-5 py-3 text-lg text-white hover:bg-clay-dark"
      >
        {submitLabel}
      </button>
    </form>
  );
}
