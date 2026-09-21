/** User-visible error banner for forms and flash messages. */
export function FormAlert({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }
  return (
    <p role="alert" className="rounded-xl border border-line bg-white p-3 text-clay leading-relaxed">
      {message}
    </p>
  );
}

/** Success or neutral notice (not an error). */
export function FormNotice({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }
  return <p className="rounded-xl border border-line bg-white p-3 leading-relaxed">{message}</p>;
}
