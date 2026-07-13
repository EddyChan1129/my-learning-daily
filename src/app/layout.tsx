import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PageTransition } from "@/components/common/PageTransition";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/app/providers";
import { siteUrl } from "@/utils/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "KnowBit｜每日學習紀錄",
    template: "%s | KnowBit",
  },
  description: "每日記低一點進步，慢慢就會見到自己行遠咗。",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "zh_HK",
    siteName: "KnowBit",
    title: "KnowBit｜每日學習紀錄",
    description: "每日記低一點進步，慢慢就會見到自己行遠咗。",
    url: "/",
    images: [{ url: "/images/logo/logo.png", width: 1254, height: 1254 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KnowBit｜每日學習紀錄",
    description: "每日記低一點進步，慢慢就會見到自己行遠咗。",
    images: ["/images/logo/logo.png"],
  },
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
