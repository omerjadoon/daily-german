import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "German Tutor <learning@your-verified-domain.com>";
const emailTo = process.env.EMAIL_TO || "omerkhanjadoons@gmail.com";

if (!apiKey) {
  console.warn("WARNING: RESEND_API_KEY is not defined in the environment variables.");
}

export const resend = new Resend(apiKey || "dummy-key-for-now");

export interface SendEmailOptions {
  to?: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Sends a B1 German tutor lesson email using Resend
 * Returns the message ID if successful.
 */
export async function sendTutorEmail(options: SendEmailOptions): Promise<string> {
  const recipient = options.to || emailTo;
  
  try {
    const response = await resend.emails.send({
      from: emailFrom,
      to: recipient,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });

    if (response.error) {
      console.error("Resend API returned an error:", response.error);
      throw new Error(`Resend Error: ${response.error.message} (Code: ${response.error.name})`);
    }

    const messageId = response.data?.id;

    if (!messageId) {
      throw new Error("Resend did not return a message ID upon successful dispatch.");
    }

    return messageId;
  } catch (error) {
    console.error("Failed to deliver email via Resend:", error);
    throw error;
  }
}
