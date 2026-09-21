/** Green checkmark shown after a successful auth email action. */
export function AuthSuccessMark({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center" role="status" aria-live="polite">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100"
        aria-hidden="true"
      >
        <svg className="h-8 w-8 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-muted leading-relaxed">{message}</p>
    </div>
  );
}
