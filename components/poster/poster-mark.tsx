export function PosterMark() {
  return (
    <div className="flex items-center gap-3" aria-label="TodayPaper 项目标识">
      <div
        className="grid size-14 grid-cols-4 gap-0.5 border border-ink bg-surface p-1"
        aria-hidden="true"
      >
        {Array.from({ length: 16 }, (_, index) => (
          <span
            key={index}
            className={
              [0, 1, 3, 4, 6, 9, 10, 12, 14, 15].includes(index)
                ? "bg-ink"
                : "bg-transparent"
            }
          />
        ))}
      </div>
      <div>
        <p className="font-brand text-lg font-bold tracking-tight">
          TodayPaper
        </p>
        <p className="mt-0.5 text-[10px] tracking-[0.14em] text-muted-ink uppercase">
          AI Editorial Edition
        </p>
      </div>
    </div>
  );
}
