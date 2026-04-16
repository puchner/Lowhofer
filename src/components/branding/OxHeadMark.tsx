type OxHeadMarkProps = {
  className?: string;
};

export function OxHeadMark({
  className = "h-14 w-16 shrink-0 text-neon drop-shadow-[0_6px_0_rgba(0,0,0,0.24)] sm:h-20 sm:w-24",
}: OxHeadMarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 128 104"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M48 32C34 22 21 17 8 18C13 34 26 43 43 45"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="10"
      />
      <path
        d="M80 32C94 22 107 17 120 18C115 34 102 43 85 45"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="10"
      />
      <path
        d="M36 44C36 29 48 20 64 20C80 20 92 29 92 44V69C92 88 79 98 64 98C49 98 36 88 36 69V44Z"
        fill="currentColor"
      />
      <path d="M45 31L37 15" stroke="currentColor" strokeLinecap="round" strokeWidth="8" />
      <path d="M83 31L91 15" stroke="currentColor" strokeLinecap="round" strokeWidth="8" />
      <path d="M49 54H57" stroke="#003b3a" strokeLinecap="round" strokeWidth="6" />
      <path d="M71 54H79" stroke="#003b3a" strokeLinecap="round" strokeWidth="6" />
      <path d="M56 75C59 78 69 78 72 75" stroke="#003b3a" strokeLinecap="round" strokeWidth="6" />
      <path d="M56 88H72" stroke="#003b3a" strokeLinecap="round" strokeWidth="5" />
    </svg>
  );
}
