import * as React from "react";

export const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(" ");

/* -------------------------------- Icons --------------------------------- */
// One line-icon set, one stroke weight. Drawn inline because Literata's web
// subset has no arrow, check or cross glyphs.
const iconPaths = {
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 18l-6-6 6-6",
  check: "M5 12.5l4.5 4.5L19 7",
  close: "M6 6l12 12M18 6L6 18",
} as const;

export function Icon({ name, size = 16, className }: { name: keyof typeof iconPaths; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden className={cx("shrink-0", className)}>
      <path d={iconPaths[name]} />
    </svg>
  );
}

/* ------------------------------- Buttons -------------------------------- */
type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";

export function Button({
  children,
  className = "",
  onClick,
  disabled,
  type = "button",
  title,
  variant = "primary",
}: React.PropsWithChildren<{
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  title?: string;
  variant?: ButtonVariant;
}>) {
  const variants: Record<ButtonVariant, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    ghost: "btn-ghost",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cx(variants[variant], className)}
    >
      {children}
    </button>
  );
}

export function SecondaryButton(props: React.ComponentProps<typeof Button>) {
  return <Button {...props} variant="secondary" />;
}

/* -------------------------------- Modal --------------------------------- */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-label={title} className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2">
        <div className="overflow-hidden rounded border border-line bg-surface-raised shadow-lift">
          <div className="flex items-center justify-between border-b border-line py-2 pl-5 pr-2">
            <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
            <button onClick={onClose} aria-label="Close" className="grid h-11 w-11 place-items-center rounded text-muted transition-colors hover:bg-surface-sunken hover:text-ink"><Icon name="close" size={18} /></button>
          </div>
          <div className="p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Cards --------------------------------- */
export function Card({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cx("card", className)}>{children}</div>;
}

export function CardHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line p-5">
      <div>
        <h3 className="font-serif text-lg font-semibold text-ink">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {right}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  return <div className={cx("p-5", className)}>{children}</div>;
}

/* ------------------------------- Inputs --------------------------------- */
export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx("field", props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx("field", props.className)} />;
}

export function Badge({ children }: React.PropsWithChildren) {
  return <span className="badge">{children}</span>;
}

/* ---------------------------- Page scaffolding -------------------------- */
export function PageHeader({
  title,
  description,
  right,
  className = "",
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="max-w-2xl">
        <h1 className="text-title font-semibold text-ink">{title}</h1>
        {description && <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {right && <div className="flex shrink-0 flex-wrap items-center gap-2">{right}</div>}
    </div>
  );
}

/** Small inline status banners. */
export function Notice({
  tone = "info",
  children,
}: React.PropsWithChildren<{ tone?: "info" | "success" | "danger" }>) {
  const tones = {
    info: "border-line-strong bg-surface-sunken text-ink",
    success: "border-success/30 bg-success/10 text-success",
    danger: "border-danger/30 bg-danger/10 text-danger",
  } as const;
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cx("rounded border px-4 py-3 text-[0.9375rem]", tones[tone])}>{children}</div>
  );
}
