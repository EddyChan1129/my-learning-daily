import type { Metadata } from "next";
import { AuthButton } from "@/components/AuthButton";
import { Footer } from "@/components/Footer";
import { I18nProvider } from "@/components/I18nProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eddy 每日學習",
  description: "A daily learning card journal by Eddy",
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
          <AuthButton />
          {children}
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
