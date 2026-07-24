export default function PuppyIllustration() {
  return (
    <svg
      className="puppy-illustration"
      viewBox="0 0 280 240"
      role="img"
      aria-label="반갑게 인사하는 하얀 강아지"
    >
      <defs>
        <radialGradient id="fur" cx="50%" cy="35%" r="70%">
          <stop offset="0" stopColor="#fff" />
          <stop offset="0.72" stopColor="#f7f2e9" />
          <stop offset="1" stopColor="#e4d6c5" />
        </radialGradient>
        <filter id="soft-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#8b7258" floodOpacity=".2" />
        </filter>
      </defs>

      <ellipse cx="140" cy="220" rx="86" ry="10" fill="#e8e8e8" opacity=".7" />
      <g filter="url(#soft-shadow)">
        <ellipse cx="140" cy="166" rx="57" ry="59" fill="url(#fur)" />
        <ellipse cx="140" cy="94" rx="69" ry="64" fill="url(#fur)" />
        <path d="M86 76C66 58 63 34 76 29c15-6 36 11 39 28Z" fill="#eee3d5" />
        <path d="M194 76c20-18 23-42 10-47-15-6-36 11-39 28Z" fill="#eee3d5" />
        <ellipse cx="111" cy="94" rx="9" ry="11" fill="#27201b" />
        <ellipse cx="169" cy="94" rx="9" ry="11" fill="#27201b" />
        <circle cx="108" cy="90" r="2.7" fill="#fff" />
        <circle cx="166" cy="90" r="2.7" fill="#fff" />
        <ellipse cx="140" cy="112" rx="10" ry="7.5" fill="#2b201b" />
        <path d="M128 122c7 13 17 14 25 0" fill="#f27c7b" stroke="#443029" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="101" cy="115" rx="11" ry="6" fill="#f7b8af" opacity=".65" />
        <ellipse cx="179" cy="115" rx="11" ry="6" fill="#f7b8af" opacity=".65" />
        <path d="M94 158c-25-15-45-10-49 3-5 16 16 34 41 36" fill="url(#fur)" />
        <path d="M186 158c25-15 45-10 49 3 5 16-16 34-41 36" fill="url(#fur)" />
        <g fill="#7b6556">
          <ellipse cx="55" cy="163" rx="5" ry="7" transform="rotate(-35 55 163)" />
          <ellipse cx="65" cy="155" rx="4" ry="6" transform="rotate(-22 65 155)" />
          <ellipse cx="47" cy="174" rx="4" ry="6" transform="rotate(-48 47 174)" />
          <ellipse cx="225" cy="163" rx="5" ry="7" transform="rotate(35 225 163)" />
          <ellipse cx="215" cy="155" rx="4" ry="6" transform="rotate(22 215 155)" />
          <ellipse cx="233" cy="174" rx="4" ry="6" transform="rotate(48 233 174)" />
        </g>
        <ellipse cx="111" cy="211" rx="24" ry="13" fill="url(#fur)" />
        <ellipse cx="169" cy="211" rx="24" ry="13" fill="url(#fur)" />
      </g>
    </svg>
  );
}
