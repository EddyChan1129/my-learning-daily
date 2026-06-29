import type { Metadata } from "next";
import { AuthButton } from "@/components/AuthButton";
import { Footer } from "@/components/Footer";
import { I18nProvider } from "@/components/I18nProvider";
import { LanguageSelect } from "@/components/LanguageSelect";
import "./globals.css";

export const metadata: Metadata = {
  title: "元浩讀書生活",
  description: "A daily study and life journal by Yuen Ho",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        <I18nProvider>
          <LanguageSelect />
          <AuthButton />
          {children}
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
