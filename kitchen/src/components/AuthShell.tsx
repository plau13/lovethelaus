import type { ReactNode } from "react";
import Link from "next/link";

type AuthShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="mx-auto grid max-w-lg gap-6">
      <div className="grid gap-2">
        <h1 className="font-serif text-4xl">{title}</h1>
        {description ? <p className="text-muted">{description}</p> : null}
      </div>
      {children}
      {footer ? <div className="text-muted text-sm">{footer}</div> : null}
      <p className="text-muted text-sm">
        <Link href="/" className="text-clay hover:text-clay-dark">
          Back to Kitchen home
        </Link>
      </p>
    </main>
  );
}

export function AuthField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-1">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const authInputClass =
  "rounded-xl border border-line bg-white px-3 py-3 w-full";

export function AuthError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="rounded-xl border border-line bg-white p-3 text-clay">{message}</p>;
}

export function AuthNotice({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="rounded-xl border border-line bg-white p-3">{message}</p>;
}
