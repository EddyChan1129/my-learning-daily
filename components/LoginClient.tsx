"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase();

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  async function submit() {
    if (!supabase) {
      setMessage("請先加入 Supabase env vars。Add Supabase env vars.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "register") {
      setMessage("註冊完成，請檢查 email。Registered. Check your email if required.");
    } else {
      router.replace("/");
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-[min(460px,calc(100%_-_32px))] place-items-center py-10">
      <Card className="w-full p-6 sm:p-8">
        <Link className="mb-8 inline-block text-sm font-bold text-neutral-600" href="/">
          返回首頁 Back home
        </Link>
        <p className="mb-2 text-sm font-bold uppercase text-neutral-600">
          Eddy 每日學習
        </p>
        <h1 className="mb-6 text-4xl font-black leading-none text-neutral-950">
          {mode === "login" ? "登入 Login" : "註冊 Register"}
        </h1>
        <div className="grid gap-3">
          <Input
            autoComplete="email"
            type="email"
            placeholder="電郵 Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            type="password"
            placeholder="密碼 Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {message ? <p className="text-sm font-bold text-red-700">{message}</p> : null}
          <Button disabled={loading} onClick={submit}>
            {loading
              ? "處理中..."
              : mode === "login"
                ? "登入 Sign in"
                : "建立帳戶 Create account"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login"
              ? "未有帳戶？註冊 Register"
              : "已有帳戶？登入 Sign in"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
