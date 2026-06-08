"use client";

/** Bottom-center toast. Visible whenever `message` is non-empty. */
export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 bg-on-surface/90 text-surface px-6 py-3 rounded-full font-label-md text-label-md shadow-lg transition-opacity duration-300 pointer-events-none z-[120] text-center ${
        message ? "opacity-100" : "opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
