import { Badge } from "@/components/ui/badge";

export function RelevanceBadge({ score }: { score: number }) {
  return (
    <Badge
      variant={score >= 90 ? "success" : score >= 80 ? "info" : "neutral"}
      aria-label={`相关度 ${score} 分`}
    >
      相关度 {score}
    </Badge>
  );
}
