import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-2xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold tracking-[0.24em] text-brand uppercase">
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        {title}
      </h2>
      <span
        className={cn(
          "mt-4 block h-0.5 w-10 bg-brand",
          align === "center" && "mx-auto",
        )}
        aria-hidden="true"
      />
      {description && (
        <p className="mt-5 text-sm leading-7 text-muted-ink sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}
