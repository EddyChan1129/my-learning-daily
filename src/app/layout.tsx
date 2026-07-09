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
  description: "每日記低一點進步，慢慢就會見到自己行遠咗。",
  icons: {
    icon: [
      { url: "/favicon.ico?v=3" },
      { url: "/favicon.png?v=3", type: "image/png", sizes: "256x256" },
    ],
    apple: "/favicon.png?v=3",
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
