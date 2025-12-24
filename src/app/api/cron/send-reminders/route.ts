import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET() {
  try {
    await resend.emails.send({
      from: "Medicine Tracker <onboarding@resend.dev>",
      to: ["dayalanmidhun@gmail.com"], // change this
      subject: "💊 Medicine Reminder",
      html: `
        <h2>Medicine Reminder</h2>
        <p>This is a test email from your app.</p>
        <p>If you received this, Resend is working ✅</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resend error:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
