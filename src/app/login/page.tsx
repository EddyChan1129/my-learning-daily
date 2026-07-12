import type { Metadata } from "next";
import { LoginClient } from "@/features/auth/components/LoginClient";

export const metadata: Metadata = {
  title: "登入",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return <LoginClient />;
}
