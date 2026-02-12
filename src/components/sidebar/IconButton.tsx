import type { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";

type Props = {
  icon: ReactNode;
  to?: string;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  floating?: boolean;
  activeWhenStartsWith?: boolean;
};

const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(" ");

const normalizePath = (s?: string) => {
  if (!s) return "";
  const noTrail = s.replace(/\/+$/, "");
  return noTrail.length ? noTrail : "/";
};

export default function IconButton({
  icon,
  to,
  onClick,
  ariaLabel,
  className,
  floating = true,
  activeWhenStartsWith = true,
}: Props) {
  const { pathname } = useLocation();
  const cur = normalizePath(pathname || "/");
  const target = normalizePath(to);

  const active = to
    ? activeWhenStartsWith
      ? cur === target || cur.startsWith(target + "/")
      : cur === target
    : false;

  const base =
    "hidden md:inline-flex items-center justify-center h-12 w-12 rounded-md border-2 transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70 cursor-pointer z-50";

  // Tailwind v4 canonical suggestion is NOT always safe here, so keep this exact value.
  const float = floating ? "absolute bottom-[10%] -right-8 md:top-auto md:-right-8 md:bottom-6" : "";

  // ✅ Use your CSS variables (Tailwind v4) so :root colors work
  // --primary / --secondary / --foreground
  const colors = active
    ? "bg-(--secondary) text-(--primary)"
    : "bg-(--primary) text-white hover:bg-(--secondary) hover:scale-105";

  const classes = cx(base, float, colors, className);

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} aria-label={ariaLabel} title={ariaLabel}>
        {icon}
      </button>
    );
  }

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={ariaLabel} title={ariaLabel}>
        {icon}
      </Link>
    );
  }

  return (
    <div className={classes} aria-label={ariaLabel} title={ariaLabel} role="img">
      {icon}
    </div>
  );
}
