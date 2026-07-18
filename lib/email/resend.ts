import { Resend } from "resend";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

export function getDefaultFromEmail(): string {
  return process.env.EMAIL_FROM || "TodayPaper <onboarding@resend.dev>";
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      error: "RESEND_API_KEY 未配置，邮件无法发送。",
    };
  }

  const from = input.from || getDefaultFromEmail();

  try {
    const { data, error } = await client.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Resend 返回未知错误。",
      };
    }

    return {
      success: true,
      messageId: data?.id,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: message,
    };
  }
}

/** 生成日报邮件 HTML。 */
export function renderDailyIssueEmail(issue: {
  newspaperName: string;
  issueDate: string;
  dailyBriefing: string;
  sections: { title: string; articles: { title: string; source: string; description: string }[] }[];
  quickNews: string[];
  watchNext: string[];
}): string {
  const sectionsHtml = issue.sections
    .map(
      (section) => `
    <div style="margin-bottom:24px;">
      <h2 style="font-size:18px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:12px;">${section.title}</h2>
      ${section.articles
        .map(
          (article) => `
        <div style="margin-bottom:16px;">
          <h3 style="font-size:15px;margin:0 0 6px;">${article.title}</h3>
          <p style="font-size:13px;color:#6b7280;margin:0 0 4px;">${article.source}</p>
          <p style="font-size:14px;line-height:1.6;margin:0;">${article.description}</p>
        </div>
      `,
        )
        .join("")}
    </div>
  `,
    )
    .join("");

  const quickNewsHtml = issue.quickNews.length
    ? `<ul style="padding-left:20px;">${issue.quickNews.map((item) => `<li style="margin-bottom:6px;">${item}</li>`).join("")}</ul>`
    : "<p>暂无快讯。</p>";

  const watchNextHtml = issue.watchNext.length
    ? `<ul style="padding-left:20px;">${issue.watchNext.map((item) => `<li style="margin-bottom:6px;">${item}</li>`).join("")}</ul>`
    : "<p>暂无后续关注。</p>";

  return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8" />
      <title>${issue.newspaperName}</title>
    </head>
    <body style="font-family:system-ui,-apple-system,sans-serif;line-height:1.6;color:#111827;max-width:640px;margin:0 auto;padding:24px;">
      <h1 style="font-size:24px;margin-bottom:8px;">${issue.newspaperName}</h1>
      <p style="color:#6b7280;margin-bottom:24px;">${issue.issueDate}</p>

      <div style="background:#f9fafb;padding:16px;border-radius:8px;margin-bottom:24px;">
        <h2 style="font-size:16px;margin-top:0;">今日简报</h2>
        <p style="margin:0;">${issue.dailyBriefing}</p>
      </div>

      ${sectionsHtml}

      <div style="margin-bottom:24px;">
        <h2 style="font-size:18px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:12px;">一句话快讯</h2>
        ${quickNewsHtml}
      </div>

      <div style="margin-bottom:24px;">
        <h2 style="font-size:18px;border-bottom:1px solid #e5e7eb;padding-bottom:8px;margin-bottom:12px;">值得继续看</h2>
        ${watchNextHtml}
      </div>

      <footer style="font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:16px;margin-top:32px;">
        由 TodayPaper 每日自动整理发送。
      </footer>
    </body>
    </html>
  `;
}

export function renderDailyIssueText(issue: {
  newspaperName: string;
  issueDate: string;
  dailyBriefing: string;
  sections: { title: string; articles: { title: string; source: string; description: string }[] }[];
  quickNews: string[];
  watchNext: string[];
}): string {
  const lines: string[] = [
    `${issue.newspaperName}`,
    `${issue.issueDate}`,
    "",
    "今日简报：",
    issue.dailyBriefing,
    "",
  ];

  for (const section of issue.sections) {
    lines.push(`【${section.title}】`);
    for (const article of section.articles) {
      lines.push(`- ${article.title}｜${article.source}`);
      lines.push(`  ${article.description}`);
    }
    lines.push("");
  }

  if (issue.quickNews.length) {
    lines.push("一句话快讯：");
    for (const item of issue.quickNews) lines.push(`• ${item}`);
    lines.push("");
  }

  if (issue.watchNext.length) {
    lines.push("值得继续看：");
    for (const item of issue.watchNext) lines.push(`• ${item}`);
    lines.push("");
  }

  lines.push("由 TodayPaper 每日自动整理发送。");
  return lines.join("\n");
}
