import type { ReactNode } from "react";
import Link from "next/link";

type AuthShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  footerClassName?: string;
};

export function AuthShell({
  title,
  description,
  children,
  footer,
  footerClassName = "flex justify-center gap-6 text-center text-muted text-sm",
}: AuthShellProps) {
  return (
    <main className="mx-auto grid max-w-lg gap-6">
      <div className="grid gap-2">
        <h1 className="font-serif text-4xl">{title}</h1>
        {description ? <p className="text-muted">{description}</p> : null}
      </div>
      {children}
      {footer ? <div className={footerClassName}>{footer}</div> : null}
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

export const authOutlineButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-line bg-white px-5 py-3 text-lg text-clay no-underline hover:border-clay";

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
