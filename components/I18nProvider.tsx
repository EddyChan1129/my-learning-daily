"use client";

import { ReactNode, useEffect, useState } from "react";
import { I18nextProvider } from "react-i18next";
import { initI18n } from "@/utils/i18n";

const i18n = initI18n();

export function I18nProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const lng = localStorage.getItem("language") ?? "zh";
    i18n.changeLanguage(lng).then(() => setReady(true));
  }, []);

  return (
    <I18nextProvider i18n={i18n}>{ready ? children : null}</I18nextProvider>
  );
}
