import { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

type ButtonVariant = "default" | "secondary" | "destructive" | "ghost";

export function buttonVariants({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: ButtonVariant;
} = {}) {
  return cn(
    "inline-flex min-h-11 items-center justify-center rounded-full border px-5 py-2 text-sm font-black transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 disabled:pointer-events-none disabled:opacity-55 motion-reduce:transition-none motion-reduce:hover:translate-y-0",
    variant === "default" &&
      "border-neutral-950 bg-neutral-950 text-white shadow-[4px_4px_0_#1a1a1a] hover:shadow-[2px_2px_0_#1a1a1a]",
    variant === "secondary" &&
      "border-stone-200 bg-white text-neutral-950 shadow-[0_8px_24px_rgba(26,26,26,0.06)]",
    variant === "destructive" &&
      "border-red-700 bg-red-700 text-white shadow-[4px_4px_0_#7f1d1d]",
    variant === "ghost" &&
      "border-transparent bg-transparent px-2 text-neutral-600 hover:bg-stone-100",
    className,
  );
}

export function Button({
  className,
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonVariants({ className, variant })}
      {...props}
    />
  );
}
