import { cn } from "@/modules/ui/cn";

interface SkipToContentProps {
  targetId?: string;
  label?: string;
  className?: string;
}

export function SkipToContent({
  targetId = "contenido-principal",
  label = "Saltar al contenido principal",
  className,
}: SkipToContentProps) {
  return (
    <a href={`#${targetId}`} className={cn("skip-link", className)}>
      {label}
    </a>
  );
}
