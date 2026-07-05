import type { Metadata } from "next";
import { AuthButton } from "@/components/layout/AuthButton";
import { Footer } from "@/components/layout/Footer";
import { I18nProvider } from "@/components/common/I18nProvider";
import { LanguageSelect } from "@/components/layout/LanguageSelect";
import { Navbar } from "@/components/layout/Navbar";
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
          <Navbar />
          <AuthButton />
          {children}
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
