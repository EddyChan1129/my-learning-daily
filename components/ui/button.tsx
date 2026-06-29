import { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "destructive";
};

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center rounded-lg border px-4 py-2 text-sm font-bold transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:pointer-events-none disabled:opacity-55",
        variant === "default" &&
          "border-neutral-950 bg-neutral-950 text-white",
        variant === "secondary" &&
          "border-stone-200 bg-white text-neutral-950",
        variant === "destructive" && "border-red-700 bg-red-700 text-white",
        className,
      )}
      {...props}
    />
  );
}
