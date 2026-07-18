import { afterEach, describe, expect, it, vi } from "vitest";

import {
  generationSteps,
  runGenerationWorkflow,
  type GenerationProgress,
} from "@/lib/workflow/generation";

afterEach(() => {
  vi.useRealTimers();
});

describe("runGenerationWorkflow", () => {
  it("reports four ordered stages and returns the operation result", async () => {
    vi.useFakeTimers();
    const progress: GenerationProgress[] = [];
    const operation = vi.fn().mockResolvedValue("done");
    const workflow = runGenerationWorkflow({
      operation,
      onProgress: (value) => progress.push(value),
      stageDelayMs: 10,
    });

    await vi.runAllTimersAsync();
    await expect(workflow).resolves.toBe("done");
    expect(operation).toHaveBeenCalledTimes(1);
    expect(progress.slice(0, 4).map((item) => item.currentStage)).toEqual(
      generationSteps.map((step) => step.id),
    );
    expect(progress.at(-1)?.completedStages).toEqual(
      generationSteps.map((step) => step.id),
    );
  });

  it("stops before the operation when aborted", async () => {
    vi.useFakeTimers();
    const controller = new AbortController();
    const operation = vi.fn().mockResolvedValue("done");
    const workflow = runGenerationWorkflow({
      operation,
      onProgress: () => undefined,
      signal: controller.signal,
      stageDelayMs: 10,
    });
    const rejection = expect(workflow).rejects.toMatchObject({
      name: "AbortError",
    });

    controller.abort();
    await vi.runAllTimersAsync();

    await rejection;
    expect(operation).not.toHaveBeenCalled();
  });
});
