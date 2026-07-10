"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { KnowbitLogo } from "@/components/common/KnowbitLogo";
import { cn } from "@/utils/cn";

const NAV_ITEMS = [
  { href: "/", labelKey: "home" },
  { href: "/my-learning", labelKey: "myLearning" },
  { href: "/contact-us", labelKey: "contactUs" },
  { href: "/todo-list", labelKey: "todoList" },
];

export function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed left-3 right-3 top-16 z-20 sm:left-1/2 sm:right-auto sm:top-4 sm:w-[min(1160px,calc(100%-40px))] sm:-translate-x-1/2"
      aria-label="Primary navigation"
    >
      <div className="grid grid-cols-1 rounded-2xl border border-stone-200 bg-white/95 p-1.5 shadow-[0_12px_32px_rgba(26,26,26,0.1)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-3 sm:rounded-[28px] sm:px-3 sm:py-2 sm:shadow-[0_16px_44px_rgba(26,26,26,0.12)]">
        <Link
          className="hidden h-14 w-56 shrink-0 items-center overflow-hidden rounded-2xl bg-[#fffaf0] px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 sm:flex"
          href="/"
          aria-label={t("dailyWall")}
        >
          <KnowbitLogo className="h-full w-full" />
        </Link>
        <div className="grid min-w-0 grid-cols-4 items-stretch gap-1 sm:flex sm:items-center">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                className={cn(
                  "flex min-h-10 min-w-0 items-center justify-center rounded-xl px-1.5 py-2 text-center text-xs font-black leading-tight text-neutral-600 transition hover:bg-stone-100 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 sm:min-h-0 sm:whitespace-nowrap sm:rounded-full sm:px-4 sm:text-sm",
                  active && "bg-neutral-950 text-white hover:bg-neutral-950 hover:text-white",
                )}
                href={item.href}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
