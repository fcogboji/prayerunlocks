import type { ReactNode } from "react";

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL?.trim() || "";
const PLAY_STORE_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL?.trim() || "";

type AppDownloadBadgesProps = {
  layout?: "row" | "column";
  theme?: "light" | "dark";
  showComingSoon?: boolean;
};

function StoreBadge({
  href,
  label,
  title,
  subtitle,
  icon,
  theme,
  comingSoon,
}: {
  href: string;
  label: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  theme: "light" | "dark";
  comingSoon: boolean;
}) {
  const isDark = theme === "dark";
  const baseClass = `inline-flex w-full min-w-0 items-center gap-3 rounded-xl border px-4 py-3 transition sm:min-w-[11rem] sm:w-auto ${
    isDark
      ? "border-white/15 bg-white/10 text-white hover:bg-white/15"
      : "border-line bg-white text-ink hover:border-[#a855f7]/40 hover:shadow-sm"
  }`;

  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center" aria-hidden>
        {icon}
      </span>
      <span className="text-left leading-tight">
        <span
          className={`block text-[10px] font-medium uppercase tracking-wide ${
            isDark ? "text-white/65" : "text-muted"
          }`}
        >
          {subtitle}
        </span>
        <span className="block text-sm font-bold">{title}</span>
      </span>
    </>
  );

  if (!href && comingSoon) {
    return (
      <span
        className={`${baseClass} cursor-default opacity-60`}
        aria-label={`${label} — coming soon`}
      >
        {content}
        <span
          className={`ml-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            isDark ? "bg-white/10 text-white/70" : "bg-[#ccff00]/20 text-[#a855f7]"
          }`}
        >
          Soon
        </span>
      </span>
    );
  }

  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={baseClass}
      aria-label={label}
    >
      {content}
    </a>
  );
}

function AppleIcon({ dark }: { dark?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill={dark ? "#fff" : "currentColor"}>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function PlayIcon({ dark }: { dark?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
      <path d="M4 3.5v17l14-8.5L4 3.5z" fill={dark ? "#fff" : "#34A853"} />
      <path
        d="M4 3.5l14 8.5-3.2 1.95-7.1-4.3L4 3.5z"
        fill={dark ? "#fff" : "#FBBC04"}
        opacity="0.9"
      />
      <path
        d="M4 21.5V12.2l7.7 4.65L18 12 4 21.5z"
        fill={dark ? "#fff" : "#EA4335"}
        opacity="0.9"
      />
      <path d="M14.8 13.45L18 12 4 3.5v8.7l10.8 1.25z" fill={dark ? "#fff" : "#4285F4"} />
    </svg>
  );
}

export function AppDownloadBadges({
  layout = "row",
  theme = "light",
  showComingSoon = true,
}: AppDownloadBadgesProps) {
  const hasAny = APP_STORE_URL || PLAY_STORE_URL;
  const showPlaceholders = showComingSoon && !hasAny;

  if (!hasAny && !showPlaceholders) return null;

  const dark = theme === "dark";

  return (
    <div
      className={`flex flex-wrap gap-3 ${
        layout === "column" ? "w-full flex-col" : "w-full items-stretch sm:items-center"
      }`}
    >
      <StoreBadge
        href={APP_STORE_URL}
        label="Download PrayerUnlocks on the App Store"
        subtitle="Download on the"
        title="App Store"
        icon={<AppleIcon dark={dark} />}
        theme={theme}
        comingSoon={showPlaceholders}
      />
      <StoreBadge
        href={PLAY_STORE_URL}
        label="Get PrayerUnlocks on Google Play"
        subtitle="Get it on"
        title="Google Play"
        icon={<PlayIcon dark={dark} />}
        theme={theme}
        comingSoon={showPlaceholders}
      />
    </div>
  );
}
