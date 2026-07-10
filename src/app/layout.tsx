import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/common/PageTransition";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/app/providers";
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
        <AppProviders>
          <Navbar />
          <PageTransition>{children}</PageTransition>
          <Footer />
          <Toaster />
        </AppProviders>
      </body>
    </html>
  );
}
