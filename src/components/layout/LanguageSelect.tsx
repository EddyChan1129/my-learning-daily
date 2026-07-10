"use client";

import { useTranslation } from "react-i18next";
import { Select } from "@/components/ui/select";

export function LanguageSelect() {
  const { i18n, t } = useTranslation();

  function changeLanguage(language: string) {
    localStorage.setItem("language", language);
    i18n.changeLanguage(language);
  }

  return (
    <label className="fixed left-3 top-3 z-10 flex items-center rounded-full border border-stone-200 bg-white/95 p-1 text-xs font-black text-neutral-600 shadow-[0_8px_24px_rgba(26,26,26,0.08)] backdrop-blur sm:left-4 sm:top-4 sm:p-1.5">
      <span className="sr-only">{t("language")}</span>
      <Select
        className="min-h-8 w-24 rounded-full px-2 text-sm sm:min-h-9 sm:w-28 sm:px-3"
        value={i18n.language}
        onChange={(event) => changeLanguage(event.target.value)}
      >
        <option value="zh">中文</option>
        <option value="en">English</option>
      </Select>
    </label>
  );
}
