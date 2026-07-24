const iconPaths = {
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.7 8.3-2.2 5.2-5.2 2.2 2.2-5.2 5.2-2.2Z" />
    </>
  ),
  walk: (
    <>
      <path d="M9 4.5a2 2 0 1 0 4 0 2 2 0 0 0-4 0Z" />
      <path d="m10.5 8-2.7 4.2-3.3 1.4M10.5 8l3 2.2 3.2-.3M9.2 10.2l2.2 3.4-1.7 5M11.4 13.6l3.8 4.1" />
    </>
  ),
  chat: (
    <path d="M20 11.3a7.7 7.7 0 0 1-8 7.4 8.6 8.6 0 0 1-3.1-.6L4 19.5l1.5-4.1A7.2 7.2 0 0 1 4 11.3C4 7.2 7.6 4 12 4s8 3.2 8 7.3Z" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20v-1.8a6.5 6.5 0 0 1 13 0V20" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  back: <path d="m15 18-6-6 6-6" />,
  eye: (
    <>
      <path d="M2.8 12s3.3-5 9.2-5 9.2 5 9.2 5-3.3 5-9.2 5-9.2-5-9.2-5Z" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M3 3l18 18M10.5 7.2c.5-.1 1-.2 1.5-.2 5.9 0 9.2 5 9.2 5a15 15 0 0 1-2.6 3.1M6.1 6.1A15.4 15.4 0 0 0 2.8 12s3.3 5 9.2 5c1.1 0 2.1-.2 3-.5" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </>
  ),
  edit: (
    <>
      <path d="M4 20h4l11-11-4-4L4 16v4Z" />
      <path d="m13.5 6.5 4 4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  image: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m4 17 4.5-4.5 3.5 3 2.5-2.5 5.5 5" />
    </>
  ),
  logout: (
    <>
      <path d="M10 5H5v14h5M14 8l4 4-4 4M9 12h9" />
    </>
  ),
};

export default function AppIcon({ name, size = 24, strokeWidth = 1.8 }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}
