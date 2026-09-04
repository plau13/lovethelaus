import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

const baseClass =
  "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-line bg-white text-ink hover:bg-paper disabled:cursor-not-allowed disabled:opacity-50";

export function IconButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button type="button" className={`${baseClass} ${className}`} {...props}>
      <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
        {children}
      </span>
    </button>
  );
}

export function IconLink({
  children,
  className = "",
  href,
  ...props
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children: ReactNode; href: string }) {
  return (
    <a href={href} className={`${baseClass} no-underline ${className}`} {...props}>
      <span className="flex h-5 w-5 items-center justify-center [&>svg]:h-5 [&>svg]:w-5">
        {children}
      </span>
    </a>
  );
}
