import { LabelHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type LabelProps = LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <label
      className={cn("grid gap-1.5 text-sm font-bold text-neutral-600", className)}
      {...props}
    />
  );
}
