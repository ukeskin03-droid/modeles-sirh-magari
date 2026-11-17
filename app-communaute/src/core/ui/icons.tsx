/**
 * ICÔNES
 *
 * Petit jeu d'icônes dessinées en SVG, pour ne pas dépendre d'une bibliothèque externe.
 * Les icônes sont décoratives : elles sont masquées aux lecteurs d'écran, le texte
 * placé à côté porte l'information.
 */
const PATHS = {
  home: "M3 10.5 12 3l9 7.5M5 9.5V20h5v-6h4v6h5V9.5",
  quiz: "M9.5 9a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1 1-1.1 1.8M12 16.5v.5M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  news: "M4 5h12v14H6a2 2 0 0 1-2-2V5Zm12 4h4v8a2 2 0 0 1-2 2M7.5 9h5M7.5 12.5h5M7.5 16h3",
  book: "M5 4.5h9a3 3 0 0 1 3 3V20H8a3 3 0 0 1-3-3V4.5Zm0 12.5a3 3 0 0 1 3-3h9M9 8.5h4",
  settings:
    "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 12a7 7 0 0 0-.1-1.3l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.2-1.3L14 3h-4l-.4 2.4a7 7 0 0 0-2.2 1.3l-2.3-.9-2 3.4 2 1.5a7 7 0 0 0 0 2.6l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2.2 1.3L10 21h4l.4-2.4a7 7 0 0 0 2.2-1.3l2.3.9 2-3.4-2-1.5c.1-.4.1-.9.1-1.3Z",
  users:
    "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.3a3.5 3.5 0 0 1 0 6.4M17.5 14.3A6 6 0 0 1 21 20",
  modules: "M4 4h7v7H4V4Zm9 0h7v7h-7V4ZM4 13h7v7H4v-7Zm9 3.5h7M16.5 13v7",
  activity: "M3 12h4l3-8 4 16 3-8h4",
  admin: "M12 3 4 6v5c0 5 3.4 8.6 8 10 4.6-1.4 8-5 8-10V6l-8-3Zm-3 9 2 2 4-4",
  eye: "M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  logout: "M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10",
  sun: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0-13v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4",
  moon: "M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z",
  auto: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18",
  check: "m5 12.5 4.5 4.5L19 7.5",
  alert: "M12 8.5v4.5m0 3v.5M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
  info: "M12 11v5.5M12 7.5V8M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z",
  arrow: "M5 12h14m-5-5 5 5-5 5",
  copy: "M9 9h10v11H9V9ZM5 15V4h10",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  image: "M4 5h16v14H4V5Zm0 10 4.5-4.5 4 4L15 12l5 5M9 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z",
  box: "M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16V8Zm0 0L12 12.5 20.5 8M12 12.5v8",
  upload: "M12 16V5m0 0-4 4m4-4 4 4M5 19h14",
  download: "M12 5v11m0 0-4-4m4 4 4-4M5 19h14",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm10-14 4 4",
  list: "M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01",
  palette: "M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-.5-.2-.8-.4-1.1-.3-.4-.4-.7-.4-1.1 0-.9.7-1.6 1.6-1.6H16a5 5 0 0 0 5-5c0-4.3-4-7.7-9-7.7ZM7.5 12a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm3-4a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm4.5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5-2 4.5 4.5",
  share: "M8.5 13.5 15.5 17M15.5 7 8.5 10.5M18 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM6 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm12 6a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
  mail: "M3.5 6h17v12h-17V6Zm0 .5 8.5 6.5 8.5-6.5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-5" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
