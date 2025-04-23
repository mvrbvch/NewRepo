import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  className?: string;
}

export default function PageHeader({ title, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between p-4 bg-primary-light border-b border-primary-light", className)}>
      <h2 className="text-xl font-semibold text-primary-dark">
        {title}
      </h2>
    </div>
  );
}