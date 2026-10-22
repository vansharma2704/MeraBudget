// Server-only helper (NOT a server action): only Inngest jobs call this. As a server action it was
// publicly callable and could send arbitrary email through the Resend key.
import "server-only";

import { Resend } from "resend";


export async function sendEmail({ to, subject, react }) {
  const resend = new Resend(process.env.RESEND_API_KEY || "");

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "MeraBudget <onboarding@resend.dev>",
      to,
      subject,
      react,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false, error };
  }
}
