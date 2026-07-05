import { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        "w-full resize-y rounded-lg border border-stone-200 bg-white px-3 py-2 text-base text-neutral-950 outline-offset-2 focus-visible:outline-2 focus-visible:outline-neutral-950",
        className,
      )}
      {...props}
    />
  );
  },
);
