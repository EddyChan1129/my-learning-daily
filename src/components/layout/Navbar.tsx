"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { href: "/", labelKey: "myLearning" },
  { href: "/contact-us", labelKey: "contactUs" },
  { href: "/faq", labelKey: "faq" },
];

export function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed left-3 right-3 top-16 z-20 flex justify-center sm:left-1/2 sm:right-auto sm:top-4 sm:-translate-x-1/2"
      aria-label="Primary navigation"
    >
      <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-stone-200 bg-white/95 p-1.5 shadow-[0_10px_30px_rgba(26,26,26,0.08)] backdrop-blur">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-2 text-sm font-black text-neutral-600 transition hover:bg-stone-100 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 sm:px-4",
                active && "bg-neutral-950 text-white hover:bg-neutral-950 hover:text-white",
              )}
              href={item.href}
            >
              {t(item.labelKey)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
