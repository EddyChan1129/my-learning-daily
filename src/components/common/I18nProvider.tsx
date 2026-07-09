"use client";

import { ReactNode, useEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { initI18n } from "@/utils/i18n";

const i18n = initI18n();

export function I18nProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const lng = localStorage.getItem("language") ?? "zh";
    void i18n.changeLanguage(lng);
  }, []);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
