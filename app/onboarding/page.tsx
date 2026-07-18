import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { OnboardingForm } from "@/components/subscription/onboarding-form";

export const metadata: Metadata = {
  title: "设置每日订阅",
  description: "选择关注方向，设置每天 08:00 的演示日报。",
};

const steps = [
  "选择关注方向",
  "设置投递方式",
  "确认并开始",
] as const;

export default function OnboardingPage() {
  return (
    <PageContainer className="py-10 sm:py-14">
      <ol
        className="mx-auto mb-10 grid max-w-4xl grid-cols-3 gap-2"
        aria-label="订阅设置步骤"
      >
        {steps.map((step, index) => (
          <li key={step} className="flex items-center gap-2 sm:gap-3">
            <span
              className={`grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold ${
                index === 0
                  ? "border-brand bg-brand text-white"
                  : "border-line-strong bg-surface text-muted-ink"
              }`}
            >
              {index + 1}
            </span>
            <span
              className={`hidden text-sm sm:block ${
                index === 0 ? "font-semibold text-ink" : "text-muted-ink"
              }`}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <span className="h-px flex-1 bg-line" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>

      <div className="mb-9 text-center">
        <p className="text-xs font-semibold tracking-[0.24em] text-brand uppercase">
          Daily Subscription
        </p>
        <h1 className="mt-3 font-serif text-4xl font-semibold tracking-tight sm:text-5xl">
          设置你的每日订阅
        </h1>
        <span
          className="mx-auto mt-4 block h-0.5 w-10 bg-brand"
          aria-hidden="true"
        />
        <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-muted-ink">
          选择你关心的方向，AI 将使用固定演示内容为你编排每日简报。
        </p>
      </div>

      <OnboardingForm />
    </PageContainer>
  );
}
