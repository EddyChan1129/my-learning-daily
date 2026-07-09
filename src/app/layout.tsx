import type { Metadata } from "next";
import { AuthButton } from "@/components/layout/AuthButton";
import { Footer } from "@/components/layout/Footer";
import { I18nProvider } from "@/components/common/I18nProvider";
import { LanguageSelect } from "@/components/layout/LanguageSelect";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/common/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "KnowBit",
  description: "每日做小小改變，記低小小進步。",
  icons: {
    icon: "/images/logo/favicon.png",
    apple: "/images/logo/favicon.png",
  },
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
          <PageTransition>{children}</PageTransition>
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
