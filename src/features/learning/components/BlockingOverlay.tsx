"use client";

export function BlockingOverlay({ message }: { message: string }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-neutral-950/35 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-72 items-center gap-3 rounded-lg border border-stone-200 bg-white px-5 py-4 text-sm font-black text-neutral-950 shadow-[8px_8px_0_#1a1a1a]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-950" />
        {message}
      </div>
    </div>
  );
}
