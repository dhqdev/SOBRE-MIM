/** Vidro escuro com borda roxa: legível por cima do dia e da noite. */
export const panel =
  "rounded-2xl border border-violet-300/30 bg-[#140c26]/80 shadow-lg shadow-black/30 backdrop-blur-md";

export const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0").replace(".", ",")}`;
};
