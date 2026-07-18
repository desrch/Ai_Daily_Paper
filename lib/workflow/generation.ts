import type { GenerationStage } from "@/types";

export const generationSteps = [
  {
    id: "fetching",
    title: "搜索相关新闻",
    description: "读取与主题相关的演示资讯",
  },
  {
    id: "ranking",
    title: "筛选代表内容",
    description: "按相关度与报道角度整理内容",
  },
  {
    id: "summarizing",
    title: "生成专题摘要",
    description: "形成导语、摘要与趋势观察",
  },
  {
    id: "layout",
    title: "完成海报排版",
    description: "套用选定的 TodayPaper 海报模板",
  },
] as const satisfies ReadonlyArray<{
  id: GenerationStage;
  title: string;
  description: string;
}>;

export interface GenerationProgress {
  currentStage: GenerationStage;
  completedStages: GenerationStage[];
}

function abortableDelay(delayMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("流程已取消", "AbortError"));
      return;
    }

    const timeoutId = setTimeout(resolve, delayMs);

    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timeoutId);
        reject(new DOMException("流程已取消", "AbortError"));
      },
      { once: true },
    );
  });
}

export async function runGenerationWorkflow<T>({
  operation,
  onProgress,
  signal,
  stageDelayMs = 550,
}: {
  operation: () => Promise<T>;
  onProgress: (progress: GenerationProgress) => void;
  signal?: AbortSignal;
  stageDelayMs?: number;
}) {
  const completedStages: GenerationStage[] = [];

  for (const step of generationSteps.slice(0, -1)) {
    onProgress({
      currentStage: step.id,
      completedStages: [...completedStages],
    });
    await abortableDelay(stageDelayMs, signal);
    completedStages.push(step.id);
  }

  onProgress({
    currentStage: "layout",
    completedStages: [...completedStages],
  });

  const result = await operation();

  if (signal?.aborted) {
    throw new DOMException("流程已取消", "AbortError");
  }

  onProgress({
    currentStage: "layout",
    completedStages: generationSteps.map((step) => step.id),
  });

  return result;
}
