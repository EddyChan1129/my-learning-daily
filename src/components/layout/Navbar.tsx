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
  { href: "/faq", labelKey: "faq" },
];

export function Navbar() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav
      className="fixed left-3 right-3 top-16 z-20 sm:left-1/2 sm:right-auto sm:top-4 sm:w-[min(1040px,calc(100%-40px))] sm:-translate-x-1/2"
      aria-label="Primary navigation"
    >
      <div className="flex max-w-full items-center justify-between gap-3 overflow-x-auto rounded-[28px] border border-stone-200 bg-white/95 px-3 py-2 shadow-[0_16px_44px_rgba(26,26,26,0.12)] backdrop-blur">
        <Link
          className="flex h-14 w-48 shrink-0 items-center overflow-hidden rounded-2xl bg-[#fffaf0] px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 sm:w-56"
          href="/"
          aria-label={t("dailyWall")}
        >
          <KnowbitLogo className="h-full w-full" />
        </Link>
        <div className="flex items-center gap-1">
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
      </div>
    </nav>
  );
}
