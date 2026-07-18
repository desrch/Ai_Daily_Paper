import { Badge } from "@/components/ui/badge";

export function NewspaperPreview() {
  return (
    <div className="relative mx-auto w-full max-w-xl px-4 py-7 sm:px-8">
      <div
        className="absolute inset-x-10 inset-y-5 rotate-3 border border-line bg-paper-deep shadow-paper"
        aria-hidden="true"
      />
      <article className="paper-grain relative border border-line-strong bg-surface p-5 shadow-paper sm:p-7">
        <header className="border-y-2 border-ink py-3 text-center">
          <p className="font-serif text-3xl font-bold tracking-[0.16em] text-brand sm:text-5xl">
            今日报纸
          </p>
          <p className="font-brand mt-1 text-[0.6rem] tracking-[0.42em]">
            TODAYPAPER
          </p>
        </header>
        <div className="mt-3 flex justify-between border-b border-line pb-2 text-[0.62rem] text-muted-ink">
          <span>2026 年 7 月 18 日</span>
          <span>第 000001 期</span>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-[1.2fr_0.8fr]">
          <div>
            <Badge>今日头条</Badge>
            <h2 className="mt-3 font-serif text-xl font-bold leading-tight sm:text-2xl">
              把分散资讯，排成一份属于你的日报
            </h2>
            <p className="mt-3 text-xs leading-5 text-muted-ink">
              订阅关注方向，由 AI 完成筛选、摘要与版面整理，每天早上准时送达。
            </p>
          </div>
          <div className="grid min-h-32 place-items-center border border-line bg-soft">
            <div className="text-center">
              <span className="font-serif text-5xl text-brand">08</span>
              <p className="mt-1 text-[0.65rem] tracking-[0.18em] text-muted-ink">
                MORNING EDITION
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-4">
          {["AI 前沿", "科技观察", "商业脉搏"].map((section) => (
            <div key={section}>
              <p className="font-serif text-sm font-bold">{section}</p>
              <span className="mt-2 block h-px bg-line" />
              <span className="mt-2 block h-1.5 w-full bg-soft" />
              <span className="mt-1.5 block h-1.5 w-4/5 bg-soft" />
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
