import { apiError, json, readJsonBody } from "@/lib/api/http";
import { sendEmail } from "@/lib/email/resend";

interface SendEmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

export async function POST(request: Request) {
  const body = await readJsonBody<SendEmailRequest>(request);
  if (!body) {
    return apiError(400, "INVALID_JSON", "请求体必须是合法 JSON。", false);
  }

  const to = typeof body.to === "string" ? body.to.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";

  if (!to || !to.includes("@")) {
    return apiError(400, "INVALID_EMAIL", "收件人邮箱格式不正确。", false);
  }
  if (!subject) {
    return apiError(400, "INVALID_SUBJECT", "邮件主题不能为空。", false);
  }

  const result = await sendEmail({
    to,
    subject,
    html: body.html || body.text || subject,
    text: body.text,
  });

  if (!result.success) {
    return apiError(500, "EMAIL_SEND_FAILED", result.error || "邮件发送失败。", true);
  }

  return json({ success: true, messageId: result.messageId });
}
