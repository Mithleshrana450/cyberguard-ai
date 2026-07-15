import { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="py-10 flex flex-col items-center gap-2 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center mb-1">
        <Icon size={22} className="text-text-secondary" strokeWidth={1.5} />
      </div>
      <p className="text-text-primary text-sm font-medium">{title}</p>
      <p className="text-text-secondary text-xs max-w-[280px]">{description}</p>
    </div>
  );
}
