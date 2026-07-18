export function NewspaperMasthead({
  issueDate,
  issueNumber,
  topics,
}: {
  issueDate: string;
  issueNumber: string;
  topics: string[];
}) {
  return (
    <header>
      <div className="grid items-end gap-4 border-y-2 border-ink py-4 sm:grid-cols-[1fr_auto_1fr]">
        <p className="text-xs leading-5 text-muted-ink">
          {issueDate}
          <br />
          个性化演示日报
        </p>
        <div className="text-center">
          <p className="font-serif text-4xl font-bold tracking-[0.16em] text-brand sm:text-6xl">
            今日报纸
          </p>
          <p className="font-brand mt-1 text-[0.65rem] tracking-[0.48em]">
            TODAYPAPER
          </p>
        </div>
        <p className="text-right text-xs leading-5 text-muted-ink">
          第 {issueNumber} 期
          <br />
          AI 整理 · 模板排版
        </p>
      </div>
      <p className="border-b border-line py-2 text-center text-xs tracking-[0.12em] text-muted-ink">
        关注方向：{topics.join(" · ")}
      </p>
    </header>
  );
}
