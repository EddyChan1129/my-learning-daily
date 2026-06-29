"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { getSupabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();

export function AuthButton() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase?.auth.signOut();
  }

  return (
    <div className="fixed right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-stone-200 bg-white/90 p-1.5 shadow-[0_10px_30px_rgba(26,26,26,0.08)] backdrop-blur">
      {user ? (
        <>
          <span className="max-w-40 truncate px-3 text-sm font-bold text-neutral-600">
            {user.email}
          </span>
          <Button className="min-h-9 rounded-full px-3" variant="secondary" onClick={signOut}>
            Sign out
          </Button>
        </>
      ) : (
        <Link
          className="inline-flex min-h-9 items-center justify-center rounded-full bg-neutral-950 px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          href="/login"
        >
          Login
        </Link>
      )}
    </div>
  );
}
