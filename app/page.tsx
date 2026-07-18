import {
  ArrowRight,
  Clock3,
  LayoutTemplate,
  Newspaper,
  ScanSearch,
  Sparkles,
  Tags,
} from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/brand/section-heading";
import { FeatureCard } from "@/components/home/feature-card";
import { NewspaperPreview } from "@/components/home/newspaper-preview";
import { PageContainer } from "@/components/layout/page-container";
import { Button } from "@/components/ui/button";

const features = [
  {
    href: "/onboarding",
    icon: Newspaper,
    index: "01",
    title: "每日订阅日报",
    description: "每天早上 8 点，由 AI 为你筛选、去重并排好一份专属日报。",
    preview: "daily" as const,
  },
  {
    href: "/theme-poster",
    icon: LayoutTemplate,
    index: "02",
    title: "主题新闻海报",
    description: "围绕一个关注主题，汇总 3～5 篇代表新闻，生成可保存的资讯海报。",
    preview: "theme" as const,
  },
  {
    href: "/topic-search",
    icon: ScanSearch,
    index: "03",
    title: "关键词专题海报",
    description: "搜索具体关键词，从多角度候选报道中选择并排成专题长图。",
    preview: "topic" as const,
  },
] as const;

const values = [
  { icon: Sparkles, label: "AI 智能筛选", detail: "降噪去重" },
  { icon: LayoutTemplate, label: "专业排版", detail: "编辑部风格" },
  { icon: Tags, label: "个性化订阅", detail: "只看所关心" },
  { icon: Clock3, label: "准时送达", detail: "每天 08:00" },
] as const;

const workflow = [
  ["01", "订阅", "选择长期关注的方向"],
  ["02", "筛选", "聚合并去除重复信息"],
  ["03", "生成", "摘要、分类与版面整理"],
  ["04", "投递", "每天早上准时送达"],
] as const;

export default function HomePage() {
  return (
    <>
      <section className="overflow-hidden border-b border-line bg-surface">
        <PageContainer className="grid min-h-[calc(100vh-4rem)] items-center gap-10 py-16 lg:grid-cols-[0.92fr_1.08fr] lg:py-20">
          <div className="relative z-10">
            <p className="mb-5 text-xs font-semibold tracking-[0.28em] text-brand uppercase">
              Your Daily Editorial
            </p>
            <h1 className="font-serif text-5xl font-bold leading-[1.03] tracking-tight text-ink sm:text-6xl lg:text-7xl">
              <span className="block text-brand">今日报纸</span>
              <span className="font-brand mt-2 block text-[0.68em] font-normal text-ink">
                TodayPaper
              </span>
            </h1>
            <div className="my-7 flex max-w-md items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-brand" />
              <span className="text-lg text-brand">✦</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <p className="max-w-xl font-serif text-2xl leading-relaxed text-ink sm:text-3xl">
              订阅你关心的方向，
              <br />
              每天早上 <span className="text-brand">8 点</span>
              ，世界为你排版完成。
            </p>
            <p className="mt-5 max-w-lg text-sm leading-7 text-muted-ink sm:text-base">
              从信息洪流中筛出真正重要的内容，以现代中文报纸的方式，整理成一份可信、克制、易读的每日简报。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/onboarding">
                  设置我的日报
                  <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/demo/home">查看演示</Link>
              </Button>
            </div>
          </div>
          <NewspaperPreview />
        </PageContainer>
      </section>

      <section className="border-b border-line bg-soft">
        <PageContainer className="grid grid-cols-2 divide-x divide-y divide-line py-2 md:grid-cols-4 md:divide-y-0">
          {values.map(({ icon: Icon, label, detail }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-3 py-5 sm:justify-center"
            >
              <Icon className="size-5 shrink-0 text-brand" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="mt-0.5 text-xs text-muted-ink">{detail}</p>
              </div>
            </div>
          ))}
        </PageContainer>
      </section>

      <section className="py-20 sm:py-24">
        <PageContainer>
          <SectionHeading
            eyebrow="Three Editions"
            title="三种方式，整理你关心的世界"
            description="一份每日订阅，两类多新闻海报。不同入口，共享同一套清晰可信的内容标准。"
            align="center"
          />
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </PageContainer>
      </section>

      <section className="border-y border-line bg-surface py-20">
        <PageContainer>
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
            <SectionHeading
              eyebrow="Editorial Flow"
              title="从订阅到送达，只需四步"
              description="你只负责表达兴趣，系统负责把复杂的信息处理过程变成每天可读的一页。"
            />
            <ol className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-2 xl:grid-cols-4">
              {workflow.map(([index, title, detail]) => (
                <li key={index} className="bg-surface p-5">
                  <span className="font-brand text-sm text-brand">{index}</span>
                  <h3 className="mt-8 font-serif text-xl font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-ink">{detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </PageContainer>
      </section>

      <section className="py-20 text-center sm:py-24">
        <PageContainer>
          <p className="font-serif text-3xl font-semibold sm:text-4xl">
            明天早上，让世界为你排版完成。
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link href="/onboarding">
              开始设置
              <ArrowRight />
            </Link>
          </Button>
        </PageContainer>
      </section>
    </>
  );
}
