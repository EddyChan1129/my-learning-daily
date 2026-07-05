"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabase } from "@/lib/supabase";

const supabase = getSupabase();

export function LoginClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("請先加入 Supabase env vars。Add Supabase env vars.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } },
          });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (mode === "register") {
      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          username: username.trim() || email.split("@")[0],
        });
      }
      setMessage("註冊完成，請檢查 email。Registered. Check your email if required.");
    } else {
      router.replace("/");
    }
  }

  return (
    <main className="mx-auto grid min-h-screen w-[min(460px,calc(100%-32px))] place-items-center py-10">
      <Card className="w-full p-6 sm:p-8">
        <Link
          className={buttonVariants({
            className: "mb-8 min-h-9 px-4",
            variant: "secondary",
          })}
          href="/"
        >
          {t("back")}
        </Link>
        <p className="mb-2 text-sm font-bold uppercase text-neutral-600">
          Eddy 每日學習
        </p>
        <h1 className="mb-6 text-4xl font-black leading-none text-neutral-950">
          {mode === "login" ? t("signInTitle") : t("signUpTitle")}
        </h1>
        <form className="grid gap-3" onSubmit={submit}>
          {mode === "register" ? (
            <Input
              autoComplete="name"
              placeholder={t("username")}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          ) : null}
          <Input
            autoComplete="email"
            type="email"
            placeholder={t("email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            type="password"
            placeholder={t("password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {message ? <p className="text-sm font-bold text-red-700">{message}</p> : null}
          <Button disabled={loading} type="submit">
            {loading
              ? t("saving")
              : mode === "login"
                ? t("login")
                : t("createAccount")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? t("noAccount") : t("login")}
          </Button>
        </form>
      </Card>
    </main>
  );
}
