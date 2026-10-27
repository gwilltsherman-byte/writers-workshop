"use client";
import * as React from "react";

export const cx = (...c: Array<string | false | null | undefined>) =>
  c.filter(Boolean).join(" ");

/* -------------------------------- Icons --------------------------------- */
// One line-icon set, one stroke weight. Drawn inline because Literata's web
// subset has no arrow, check or cross glyphs.
const iconPaths = {
  menu: "M4 6h16M4 12h16M4 18h16",
  pen: "M14 5l5 5M4 20l5-1L20 8a2.8 2.8 0 0 0-4-4L5 15l-1 5Z",
  book: "M12 5v15M12 5C9 3 5 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-2-1-6-1-9 1Z",
  refresh:
    "M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-2l2 7M4 12l2 7a7 7 0 0 0 12-2",
  settings:
    "M9.5 3h5l.5 2.5 2 1.2 2.4-.8 2.5 4.3-1.9 1.7v2.2l1.9 1.7-2.5 4.3-2.4-.8-2 1.2-.5 2.5h-5L9 20.5l-2-1.2-2.4.8-2.5-4.3L4 14.1v-2.2l-1.9-1.7 2.5-4.3 2.4.8L9 5.5 9.5 3ZM15.5 13a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M19 12H5M11 18l-6-6 6-6",
  check: "M5 12.5l4.5 4.5L19 7",
  close: "M6 6l12 12M18 6L6 18",
} as const;

export function Icon({
  name,
  size = 16,
  className,
}: {
  name: keyof typeof iconPaths;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cx("shrink-0", className)}
    >
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
  const dialog = React.useRef<HTMLDialogElement>(null);
  React.useEffect(() => {
    const node = dialog.current;
    if (!open || !node) return;
    const previous = document.activeElement as HTMLElement | null;
    node.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      node.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [open]);
  return (
    <dialog
      ref={dialog}
      aria-label={title}
      className="workshop-dialog"
      onKeyDown={(e) => {
        if (e.key !== "Tab") return;
        const controls = Array.from(
          e.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog-content">
        <div className="flex items-center justify-between gap-4 border-b border-line py-3 pl-6 pr-3">
          <h2 className="font-serif text-xl text-ink">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="btn-ghost h-11 w-11 p-0"
          >
            <Icon name="close" size={19} />
          </button>
        </div>
        <div className="p-6">{open && children}</div>
      </div>
    </dialog>
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
        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
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

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
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
    <div
      className={cx(
        "page-header mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl">
        <h1 className="text-title font-semibold text-ink">{title}</h1>
        {description && (
          <p className="mt-3 max-w-[60ch] text-lg leading-relaxed text-ink-soft">
            {description}
          </p>
        )}
      </div>
      {right && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {right}
        </div>
      )}
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
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cx("rounded border px-4 py-3 text-[0.9375rem]", tones[tone])}
    >
      {children}
    </div>
  );
}
