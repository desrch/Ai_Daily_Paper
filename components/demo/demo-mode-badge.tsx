import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DemoModeBadge({ className }: { className?: string }) {
  return (
    <Badge
      variant="info"
      className={cn("inline-flex items-center gap-1.5", className)}
    >
      <FlaskConical className="size-3.5" aria-hidden="true" />
      演示模式
    </Badge>
  );
}
