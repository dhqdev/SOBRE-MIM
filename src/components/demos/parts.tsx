/** Pecinhas compartilhadas pelas cenas das demos. */

/** Classes pra algo que aparece (sobe e acende) quando `show` vira true. */
export const reveal = (show: boolean, extra = '') =>
  `transition-all duration-500 ease-out ${show ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-2'} ${extra}`;

/** Cursor falso que desliza até (x, y) e "clica" quando `click` muda. */
export const Cursor = ({ x, y, click }: { x: number; y: number; click?: number }) => (
  <div
    className="pointer-events-none absolute z-30 transition-[left,top] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)]"
    style={{ left: x, top: y }}
  >
    {click !== undefined && (
      <span
        key={click}
        className="absolute -left-3 -top-3 h-6 w-6 rounded-full border-2 border-accent [animation:demo-click_600ms_ease-out_700ms_both]"
      />
    )}
    <svg width="18" height="18" viewBox="0 0 24 24" className="drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
      <path
        d="M4 2l16 10-7 1.5L9.5 21z"
        fill="#fff"
        stroke="#0b0b0e"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

/** Três pontinhos de "digitando…". */
export const Typing = ({ className = '' }: { className?: string }) => (
  <span className={`inline-flex gap-1 ${className}`}>
    {[0, 1, 2].map((i) => (
      <span
        key={i}
        className="h-1.5 w-1.5 rounded-full bg-current opacity-60 [animation:demo-dot_1s_ease-in-out_infinite]"
        style={{ animationDelay: `${i * 0.15}s` }}
      />
    ))}
  </span>
);

/** Valor que entra com uma animaçãozinha sempre que muda. */
export const Ticker = ({ value, className = '' }: { value: string; className?: string }) => (
  <span
    key={value}
    className={`inline-block animate-in fade-in slide-in-from-bottom-1 duration-500 ${className}`}
  >
    {value}
  </span>
);
