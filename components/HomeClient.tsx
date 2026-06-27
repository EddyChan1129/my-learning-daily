"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CardForm } from "@/components/CardForm";
import {
  emptyCard,
  LearningCard,
  LearningCardInput,
  slugify,
} from "@/lib/learningCards";
import { getSupabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const supabase = getSupabase();

export function HomeClient() {
  const [cards, setCards] = useState<LearningCard[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadCards();

    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  async function loadCards() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("learning_cards")
      .select("*")
      .order("learned_date", { ascending: false });

    if (error) {
      setMessage(error.message);
      return;
    }

    setCards(data ?? []);
  }

  async function signIn() {
    if (!supabase) return;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setMessage(error?.message ?? "");
  }

  async function signOut() {
    if (!supabase) return;

    await supabase.auth.signOut();
    setShowForm(false);
  }

  async function createCard(value: LearningCardInput) {
    if (!supabase || !user) return;

    const { error } = await supabase.from("learning_cards").insert({
      ...value,
      slug: slugify(value.title),
      user_id: user.id,
    });

    if (error) throw error;

    setShowForm(false);
    await loadCards();
  }

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">Eddy 每日學習</p>
          <h1>每天留低一張學習卡。</h1>
          <p className="intro">
            我係 Eddy，呢度記錄每日學到的前端、產品、工具同生活知識。
            每張卡都係一個小重點，方便之後重溫。
          </p>
        </div>

        <div className="authBox">
          {!supabase ? (
            <p className="muted">Add Supabase env vars to enable login.</p>
          ) : user ? (
            <>
              <p className="muted">{user.email}</p>
              <button className="button secondary" onClick={signOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <button className="button" onClick={signIn}>
                Sign in
              </button>
            </>
          )}
        </div>
      </section>

      {message ? <p className="notice">{message}</p> : null}

      {user ? (
        <section className="createPanel">
          <button className="button" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Close form" : "New learning card"}
          </button>
          {showForm ? (
            <CardForm
              initialValue={emptyCard}
              submitLabel="Create card"
              onSubmit={createCard}
            />
          ) : null}
        </section>
      ) : null}

      <section className="grid" aria-label="Learning cards">
        {cards.map((card) => (
          <Link
            className="card"
            href={`/learning/${card.slug ?? card.id}`}
            key={card.id}
          >
            <div className="thumb">
              {card.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={card.image_url} alt="" />
              ) : (
                <span>{card.category.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="cardBody">
              <p className="tag">{card.category}</p>
              <h2>{card.title}</h2>
              <p>{card.summary}</p>
              <time>{card.learned_date}</time>
            </div>
          </Link>
        ))}
      </section>

      {cards.length === 0 ? (
        <p className="empty">No learning cards yet.</p>
      ) : null}
    </main>
  );
}
