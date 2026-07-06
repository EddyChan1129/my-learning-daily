import { cn } from "@/utils/cn";

export function KnowbitLogo({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block bg-no-repeat", className)}
      style={{
        backgroundImage: "url('/images/logo/logo.png')",
        backgroundPosition: "center 52%",
        backgroundSize: "100% auto",
      }}
    />
  );
}
