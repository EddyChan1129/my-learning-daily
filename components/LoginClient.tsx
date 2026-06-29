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

  async function signIn() {
    if (!supabase) {
      setMessage("Add Supabase env vars to enable login.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.replace("/");
  }

  return (
    <main className="mx-auto grid min-h-screen w-[min(460px,calc(100%_-_32px))] place-items-center py-10">
      <Card className="w-full p-6 sm:p-8">
        <Link className="mb-8 inline-block text-sm font-bold text-neutral-600" href="/">
          Back home
        </Link>
        <p className="mb-2 text-sm font-bold uppercase text-neutral-600">
          Eddy 每日學習
        </p>
        <h1 className="mb-6 text-4xl font-black leading-none text-neutral-950">
          Login
        </h1>
        <div className="grid gap-3">
          <Input
            autoComplete="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Input
            autoComplete="current-password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {message ? <p className="text-sm font-bold text-red-700">{message}</p> : null}
          <Button disabled={loading} onClick={signIn}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </Card>
    </main>
  );
}
