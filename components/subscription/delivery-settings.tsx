import { Clock3, Mail } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function DeliverySettings({
  email,
  dailyDelivery,
  emailError,
  onEmailChange,
  onDailyDeliveryChange,
}: {
  email: string;
  dailyDelivery: boolean;
  emailError?: string;
  onEmailChange: (value: string) => void;
  onDailyDeliveryChange: (value: boolean) => void;
}) {
  return (
    <section className="space-y-5 border-t border-line pt-6">
      <div>
        <Label htmlFor="delivery-email">接收邮箱</Label>
        <div className="relative mt-2">
          <Mail
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-ink"
            aria-hidden="true"
          />
          <Input
            id="delivery-email"
            type="email"
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="reader@example.com"
            className="pl-10"
            aria-invalid={Boolean(emailError)}
            aria-describedby={
              emailError ? "delivery-email-error" : "delivery-email-help"
            }
          />
        </div>
        {emailError ? (
          <p
            id="delivery-email-error"
            className="mt-2 text-sm text-danger"
            role="alert"
          >
            {emailError}
          </p>
        ) : (
          <p id="delivery-email-help" className="mt-2 text-xs text-muted-ink">
            当前仅用于本地演示，不会真实发送邮件。
          </p>
        )}
      </div>

      <div className="rounded-md border border-line bg-surface">
        <div className="flex items-center justify-between gap-5 p-4">
          <div>
            <p className="font-medium text-ink">每日送达</p>
            <p className="mt-1 text-xs leading-5 text-muted-ink">
              开启后，每天固定时间为你整理日报
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={dailyDelivery}
            aria-label="每日送达"
            onClick={() => onDailyDeliveryChange(!dailyDelivery)}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full bg-line-strong transition-colors",
              dailyDelivery && "bg-info",
            )}
          >
            <span
              className={cn(
                "absolute top-1 left-1 size-5 rounded-full bg-white shadow-sm transition-transform",
                dailyDelivery && "translate-x-5",
              )}
            />
          </button>
        </div>
        <div className="flex items-center justify-between border-t border-line p-4">
          <div className="flex items-center gap-2">
            <Clock3 className="size-4 text-muted-ink" aria-hidden="true" />
            <span className="text-sm font-medium">送达时间</span>
          </div>
          <span className="rounded-sm border border-line-strong bg-soft px-4 py-1.5 font-mono text-sm text-muted-ink">
            08:00
          </span>
        </div>
      </div>
    </section>
  );
}
