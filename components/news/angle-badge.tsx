import { Badge } from "@/components/ui/badge";
import type { NewsAngle } from "@/types";

const angleStyles: Record<NewsAngle, string> = {
  政策: "border-brand/30 bg-brand/8 text-brand",
  技术: "border-info/30 bg-info/8 text-info",
  产业: "border-amber-700/30 bg-amber-700/8 text-amber-800",
  应用: "border-success/30 bg-success/8 text-success",
  市场: "border-violet-700/30 bg-violet-700/8 text-violet-800",
};

export function AngleBadge({ angle }: { angle: NewsAngle }) {
  return (
    <Badge variant="neutral" className={angleStyles[angle]}>
      {angle}
    </Badge>
  );
}
