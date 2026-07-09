"use client";

import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="page-shell pb-8">
      <div className="border-t border-stone-300 py-5">
        <div className="flex flex-col gap-4 text-sm font-bold text-neutral-500 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-base font-black text-neutral-950">
              {t("dailyWall")}
            </p>
            <p className="mt-1 max-w-xl">{t("footerOwnerInfo")}</p>
          </div>
          <div className="text-left sm:text-right">
            <p>{t("footerCopyright")}</p>
            <p className="mt-1 text-neutral-400">{t("footerOwner")}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
