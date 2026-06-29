import type { Metadata } from "next";
import { AuthButton } from "@/components/AuthButton";
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
        <AuthButton />
        {children}
      </body>
    </html>
  );
}
