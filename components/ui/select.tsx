import { SelectHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "min-h-12 w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-base text-neutral-950 outline-offset-2 focus-visible:outline-2 focus-visible:outline-neutral-950",
        className,
      )}
      {...props}
    />
  );
}
