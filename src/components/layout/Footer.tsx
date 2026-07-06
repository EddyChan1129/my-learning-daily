"use client";

import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mx-auto mt-10 w-[min(1160px,calc(100%-28px))] border-t border-stone-300 py-6 text-sm font-bold text-neutral-500 sm:w-[min(1160px,calc(100%-40px))]">
      <p>{t("dailyWall")} · {t("footer")}</p>
    </footer>
  );
}
