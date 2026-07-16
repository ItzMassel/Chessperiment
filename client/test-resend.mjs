// Test script to verify Resend email functionality
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log("Testing Resend email functionality...");
  console.log("API Key present:", !!process.env.RESEND_API_KEY);
  console.log(
    "API Key (first 10 chars):",
    process.env.RESEND_API_KEY?.substring(0, 10),
  );

  try {
    const { data, error } = await resend.emails.send({
      from: "Chessperiment Survey <delivered@resend.dev>",
      to: ["lasse.secaccbs@gmail.com"],
      subject: "Test Email from ChessPIE",
      html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>Test Email</h2>
                    <p>This is a test email to verify the Resend integration is working.</p>
                    <p>Timestamp: ${new Date().toISOString()}</p>
                </div>
            `,
    });

    if (error) {
      console.error("❌ Email failed to send");
      console.error("Error:", error);
      process.exit(1);
    }

    console.log("✅ Email sent successfully!");
    console.log("Response data:", data);
    process.exit(0);
  } catch (err) {
    console.error("❌ Unexpected error:", err);
    process.exit(1);
  }
}

testEmail();
