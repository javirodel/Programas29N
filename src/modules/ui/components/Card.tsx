import type { ReactNode } from "react";
import { cn } from "@/modules/ui/cn";

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "section";
}

export function Card({ children, className, as: Tag = "div" }: CardProps) {
  return (
    <Tag className={cn("rounded-xl border border-line bg-surface p-5", className)}>{children}</Tag>
  );
}
