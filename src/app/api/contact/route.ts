import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  content: z.string().trim().min(1).max(5000),
  email: z.string().trim().email().max(254),
  title: z.string().trim().min(1).max(160),
  website: z.string().max(0).optional(),
});

export async function POST(request: Request) {
  const input = contactSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) {
    return NextResponse.json({ error: "Invalid contact form." }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.my_email;
  const from =
    process.env.RESEND_FROM_EMAIL ?? "Knowbit <onboarding@resend.dev>";

  if (!apiKey || !recipient) {
    return NextResponse.json(
      { error: "Contact email is not configured." },
      { status: 500 },
    );
  }

  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      reply_to: input.data.email,
      subject: `[Knowbit Contact] ${input.data.title}`,
      text: `From: ${input.data.email}\n\n${input.data.content}`,
      to: [recipient],
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    console.error("Resend contact email failed:", await response.text());
    return NextResponse.json(
      { error: "Email could not be sent. Please try again." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
