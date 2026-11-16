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
    | "signal";
  size?: number;
  style?: CSSProperties;
}) {
  const paths = {
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
    >
      {paths[name]}
    </svg>
  );
}
