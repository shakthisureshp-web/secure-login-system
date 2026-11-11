import React from 'react';

interface ShieldLogoProps {
  className?: string;
  size?: number;
}

export const ShieldLogo: React.FC<ShieldLogoProps> = ({ className = '', size = 28 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="shieldGrad" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00f0ff" />
          <stop offset="0.5" stopColor="#0284c7" />
          <stop offset="1" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="lockGrad" x1="10" y1="11" x2="22" y2="25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="1" stopColor="#93c5fd" />
        </linearGradient>
      </defs>

      {/* Outer Cyber Shield Path */}
      <path
        d="M16 2L4 6.8V15.2C4 22.8 9.1 29.8 16 31.8C22.9 29.8 28 22.8 28 15.2V6.8L16 2Z"
        stroke="url(#shieldGrad)"
        strokeWidth="2"
        strokeLinejoin="round"
        fill="#071226"
        fillOpacity="0.8"
      />

      {/* Inner Accent Line */}
      <path
        d="M16 5.5L7 9.1V15.2C7 21.2 10.8 26.8 16 28.5C21.2 26.8 25 21.2 25 15.2V9.1L16 5.5Z"
        stroke="#0284c7"
        strokeWidth="1"
        strokeOpacity="0.4"
      />

      {/* Lock Shackle */}
      <path
        d="M12.5 13.5V11.5C12.5 9.567 14.067 8 16 8C17.933 8 19.5 9.567 19.5 11.5V13.5"
        stroke="url(#lockGrad)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Lock Body */}
      <rect
        x="11"
        y="13.5"
        width="10"
        height="8"
        rx="1.5"
        fill="url(#shieldGrad)"
        stroke="#38bdf8"
        strokeWidth="1"
      />

      {/* Lock Keyhole */}
      <circle cx="16" cy="17" r="1.2" fill="#ffffff" />
      <path d="M16 18.2V19.8" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
};
