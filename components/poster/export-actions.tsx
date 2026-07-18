"use client";

import {
  Check,
  Download,
  LoaderCircle,
  Printer,
  RefreshCcw,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import type { RefObject } from "react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

type ToastState = {
  message: string;
  variant: "success" | "error" | "info";
};

function safeFileSegment(value: string) {
  return value.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, "-");
}

export function ExportActions({
  posterRef,
  topic,
  typeLabel,
  createdAt,
  isSaved,
  onSave,
  regenerateHref,
  adjustHref,
  saveSuccessMessage = "作品已保存，可在历史作品中查看。",
}: {
  posterRef: RefObject<HTMLDivElement | null>;
  topic: string;
  typeLabel: string;
  createdAt: string;
  isSaved: boolean;
  onSave: () => Promise<boolean>;
  regenerateHref: string;
  adjustHref?: string;
  saveSuccessMessage?: string;
}) {
  const [saved, setSaved] = useState(isSaved);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFailed, setExportFailed] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  async function savePoster() {
    if (saved) {
      setToast({ message: "这件作品已经保存在历史作品中。", variant: "info" });
      return;
    }

    if (await onSave()) {
      setSaved(true);
      setToast({
        message: saveSuccessMessage,
        variant: "success",
      });
    } else {
      setToast({
        message: "暂时无法保存作品，请重新生成后再试。",
        variant: "error",
      });
    }
  }

  async function downloadPoster() {
    if (!posterRef.current || isExporting) {
      return;
    }

    setIsExporting(true);
    setExportFailed(false);

    try {
      await document.fonts?.ready;
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(posterRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#fffdf8",
      });
      const link = document.createElement("a");
      const date = createdAt.slice(0, 10);
      link.download = `TodayPaper-${safeFileSegment(topic)}-${typeLabel}-${date}.png`;
      link.href = dataUrl;
      link.click();
      setToast({
        message: "长图已生成，浏览器正在下载。",
        variant: "success",
      });
    } catch {
      setExportFailed(true);
      setToast({
        message: "长图导出失败，可使用下方“打印替代”保存为 PDF。",
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <>
      <div className="grid gap-2" data-print-hidden>
        {adjustHref && (
          <Button asChild variant="secondary">
            <Link href={adjustHref}>
              <SlidersHorizontal />
              调整新闻
            </Link>
          </Button>
        )}
        <Button asChild variant="secondary">
          <Link href={regenerateHref}>
            <RefreshCcw />
            重新生成
          </Link>
        </Button>
        <Button
          type="button"
          variant={saved ? "secondary" : "outline"}
          onClick={() => void savePoster()}
        >
          {saved ? <Check /> : <Save />}
          {saved ? "已保存作品" : "保存作品"}
        </Button>
        <Button
          type="button"
          onClick={() => void downloadPoster()}
          disabled={isExporting}
          aria-busy={isExporting}
        >
          {isExporting ? (
            <LoaderCircle className="animate-spin" />
          ) : (
            <Download />
          )}
          {isExporting ? "正在导出…" : "下载长图"}
        </Button>
        {exportFailed && (
          <Button
            type="button"
            variant="danger"
            onClick={() => window.print()}
          >
            <Printer />
            打印替代
          </Button>
        )}
      </div>
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          onDismiss={() => setToast(null)}
        />
      )}
    </>
  );
}
