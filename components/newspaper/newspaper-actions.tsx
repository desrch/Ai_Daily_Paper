"use client";

import { Download, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Toast } from "@/components/ui/toast";

export function NewspaperActions({ title }: { title: string }) {
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error" | "info";
  } | null>(null);

  async function shareIssue() {
    const shareData = {
      title,
      text: `查看 ${title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setToast({
          message: "日报链接已复制到剪贴板。",
          variant: "success",
        });
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setToast({
        message: "暂时无法分享，请复制浏览器地址栏中的链接。",
        variant: "error",
      });
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2" data-print-hidden>
        <Button type="button" variant="secondary" onClick={shareIssue}>
          <Share2 />
          分享
        </Button>
        <Button type="button" onClick={() => window.print()}>
          <Download />
          打印 / 下载
        </Button>
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
