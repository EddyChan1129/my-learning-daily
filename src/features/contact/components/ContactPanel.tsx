"use client";

import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ContactPanel() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"idle" | "sending" | "error">(
    "idle",
  );
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    setStatus("sending");
    setError("");

    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify({
          content: formData.get("content"),
          email: formData.get("email"),
          title: formData.get("title"),
          website: formData.get("website"),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Email could not be sent.");

      form.reset();
      setStatus("idle");
      toast.success(t("footerContactSubmitted"));
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Email could not be sent.";

      setError(message);
      setStatus("error");
      toast.error(message);
    }
  }

  return (
    <Card className="overflow-hidden rounded-none border-stone-300 shadow-[8px_8px_0_rgba(26,26,26,0.88)]">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,0.8fr)_minmax(420px,1fr)]">
        <div className="p-5 sm:p-7">
          <p className="text-sm font-black text-emerald-800">
            {t("footerContactEyebrow")}
          </p>
          <h1 className="mt-3 text-5xl font-black leading-none text-neutral-950 sm:text-6xl">
            {t("contactUs")}
          </h1>
          <p className="mt-5 max-w-md text-lg font-bold leading-relaxed text-neutral-600">
            {t("footerContactBody")}
          </p>
          <p className="mt-6 border-l-2 border-[#f3b51b] pl-4 text-sm font-black leading-relaxed text-neutral-800">
            {t("footerContactNote")}
          </p>
        </div>

        <div className="border-t border-stone-200 bg-[#fffaf0] p-5 sm:p-7 lg:border-l lg:border-t-0">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <input
              className="hidden"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <Label>
              {t("email")}
              <Input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
              />
            </Label>
            <Label>
              {t("title")}
              <Input
                name="title"
                required
                placeholder={t("footerContactTitlePlaceholder")}
              />
            </Label>
            <Label>
              {t("content")}
              <Textarea
                className="min-h-32"
                name="content"
                required
                placeholder={t("footerContactContentPlaceholder")}
              />
            </Label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-bold leading-relaxed text-neutral-500">
                {status === "error" ? error : t("footerContactPending")}
              </p>
              <Button
                className="w-full sm:w-auto"
                disabled={status === "sending"}
                type="submit"
              >
                {status === "sending" ? t("sending") : t("submit")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Card>
  );
}
