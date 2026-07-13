import type { Metadata } from "next";
import { ContactPanel } from "@/features/contact/components/ContactPanel";

export const metadata: Metadata = {
  title: "聯絡我們",
  description: "聯絡 KnowBit，分享功能建議、問題或合作方向。",
  alternates: { canonical: "/contact-us" },
  openGraph: {
    type: "website",
    title: "聯絡我們 | KnowBit",
    description: "聯絡 KnowBit，分享功能建議、問題或合作方向。",
    url: "/contact-us",
  },
  twitter: {
    card: "summary",
    title: "聯絡我們 | KnowBit",
    description: "聯絡 KnowBit，分享功能建議、問題或合作方向。",
  },
};

export default function ContactUsPage() {
  return (
    <main className="page-shell min-h-screen pb-16 pt-32 sm:pt-36">
      <ContactPanel />
    </main>
  );
}
