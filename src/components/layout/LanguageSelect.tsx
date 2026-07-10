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
    <label className="flex w-full items-center rounded-xl border border-stone-200 bg-stone-50 p-1 text-xs font-black text-neutral-600">
      <span className="sr-only">{t("language")}</span>
      <Select
        className="min-h-10 w-full rounded-lg border-0 bg-transparent px-3 text-sm"
        value={i18n.language}
        onChange={(event) => changeLanguage(event.target.value)}
      >
        <option value="zh">中文</option>
        <option value="en">English</option>
      </Select>
    </label>
  );
}
