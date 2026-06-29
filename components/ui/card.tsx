import { HTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-stone-200 bg-white shadow-[0_10px_30px_rgba(26,26,26,0.06)]",
        className,
      )}
      {...props}
    />
  );
}
