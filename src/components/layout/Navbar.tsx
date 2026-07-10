"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { KnowbitLogo } from "@/components/common/KnowbitLogo";
import { AuthButton } from "@/components/layout/AuthButton";
import { LanguageSelect } from "@/components/layout/LanguageSelect";
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    function closeOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [menuOpen]);

  return (
    <nav
      className="fixed left-3 right-3 top-3 z-30 sm:left-1/2 sm:right-auto sm:top-4 sm:w-[min(1160px,calc(100%-40px))] sm:-translate-x-1/2"
      aria-label="Primary navigation"
    >
      <div className="flex h-12 items-center justify-between rounded-2xl border border-stone-200 bg-white/95 px-2 shadow-[0_10px_28px_rgba(26,26,26,0.1)] backdrop-blur sm:hidden">
        <button
          className="grid size-9 place-items-center rounded-xl text-neutral-950 hover:bg-stone-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          type="button"
          aria-controls="mobile-navigation-menu"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="grid gap-1" aria-hidden="true">
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
            <span className="block h-0.5 w-5 bg-current" />
          </span>
        </button>
        <Link
          className="h-10 w-36 overflow-hidden rounded-xl bg-[#fffaf0] px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          href="/"
          aria-label={t("dailyWall")}
          onClick={() => setMenuOpen(false)}
        >
          <KnowbitLogo className="h-full w-full" />
        </Link>
      </div>

      <div
        id="mobile-navigation-menu"
        className={cn(
          "mt-2 rounded-2xl border border-stone-200 bg-white/98 p-3 shadow-[0_18px_48px_rgba(26,26,26,0.16)] backdrop-blur",
          menuOpen ? "grid gap-3" : "hidden",
          "sm:mt-0 sm:flex sm:items-center sm:justify-between sm:gap-3 sm:rounded-[28px] sm:bg-white/95 sm:px-3 sm:py-2 sm:shadow-[0_16px_44px_rgba(26,26,26,0.12)]",
        )}
      >
        <Link
          className="hidden h-14 w-56 shrink-0 items-center overflow-hidden rounded-2xl bg-[#fffaf0] px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 sm:flex"
          href="/"
          aria-label={t("dailyWall")}
        >
          <KnowbitLogo className="h-full w-full" />
        </Link>
        <div className="grid min-w-0 gap-1 sm:flex sm:items-center">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                className={cn(
                  "flex min-h-11 min-w-0 items-center rounded-xl px-3 py-2 text-sm font-black text-neutral-600 transition hover:bg-stone-100 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950 sm:min-h-0 sm:justify-center sm:whitespace-nowrap sm:rounded-full sm:px-4",
                  active && "bg-neutral-950 text-white hover:bg-neutral-950 hover:text-white",
                )}
                href={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </div>
        <div className="grid gap-2 border-t border-stone-200 pt-3 sm:block sm:border-0 sm:p-0">
          <div className="sm:hidden">
            <LanguageSelect />
          </div>
          <AuthButton onNavigate={() => setMenuOpen(false)} />
        </div>
      </div>
    </nav>
  );
}
