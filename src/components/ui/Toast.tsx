"use client";

/** Bottom-center toast. Visible whenever `message` is non-empty. */
export function Toast({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 md:bottom-10 left-1/2 -translate-x-1/2 bg-on-surface text-background px-6 py-3 kicker shadow-lg transition-opacity duration-300 pointer-events-none z-[120] text-center whitespace-nowrap ${
        message ? "opacity-100" : "opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
