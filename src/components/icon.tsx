import type { CSSProperties } from "react";
export function Icon({
  name,
  size = 20,
  style,
}: {
  name:
    | "cards"
    | "reports"
    | "arrow"
    | "plus"
    | "search"
    | "copy"
    | "link"
    | "logout"
    | "signal"
    | "save"
    | "trash"
    | "check"
    | "close"
    | "filter"
    | "reset"
    | "download"
    | "previous";
  size?: number;
  style?: CSSProperties;
}) {
  const paths = {
    save: (
      <>
        <path d="m19 21-14 0a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M7 3v6h9V3M7 21v-8h10v8" />
      </>
    ),
    trash: (
      <>
        <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    filter: (
      <>
        <path d="M4 5h16l-6 7v7l-4 2v-9L4 5Z" />
      </>
    ),
    reset: (
      <>
        <path d="M3 10a9 9 0 1 1 2 8M3 4v6h6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />
      </>
    ),
    previous: <path d="m15 5-7 7 7 7" />,
    cards: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M3 10h18M7 15h3" />
      </>
    ),
    reports: (
      <>
        <path d="M4 20h17M7 16v-5M12 16V5M17 16V8" />
      </>
    ),
    arrow: (
      <>
        <path d="m9 5 7 7-7 7" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4 4" />
      </>
    ),
    copy: (
      <>
        <rect x="8" y="8" width="12" height="13" rx="2" />
        <path d="M16 8V4a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h4" />
      </>
    ),
    link: (
      <>
        <path d="M14 4h6v6M20 4l-9 9" />
        <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H5v16h5M9 12h12m-4-4 4 4-4 4" />
      </>
    ),
    signal: (
      <>
        <path d="M9 9a4 4 0 0 1 0 6M13 6a8 8 0 0 1 0 12M17 3a12 12 0 0 1 0 18" />
        <path d="M5 11v2" />
      </>
    ),
  };
  return (
    <svg
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}
