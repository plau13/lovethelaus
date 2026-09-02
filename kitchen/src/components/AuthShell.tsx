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
  footerClassName = "flex flex-wrap justify-center gap-6 text-center text-muted text-sm",
}: AuthShellProps) {
  return (
    <main className="mx-auto w-full max-w-md">
      <div className="grid gap-6 rounded-2xl border border-line bg-white p-7 shadow-[0_0.375rem_1.5rem_rgb(44_24_16/8%)]">
        <div className="grid gap-2">
          <h1 className="font-serif text-3xl font-bold">{title}</h1>
          {description ? <p className="text-muted leading-relaxed">{description}</p> : null}
        </div>
        {children}
        {footer ? <div className={footerClassName}>{footer}</div> : null}
      </div>
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
    <label className="grid gap-1.5 text-[0.9375rem] font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const authInputClass =
  "rounded-xl border border-line bg-white px-3 py-3 w-full text-default focus:outline-none focus:ring-2 focus:ring-clay/35";

export const authOutlineButtonClass =
  "inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-line bg-white px-5 py-3 text-lg text-clay no-underline hover:border-clay";

export function AuthError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="rounded-xl border border-line bg-white p-3 text-clay leading-relaxed">{message}</p>;
}

export function AuthNotice({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return <p className="rounded-xl border border-line bg-white p-3 leading-relaxed">{message}</p>;
}
