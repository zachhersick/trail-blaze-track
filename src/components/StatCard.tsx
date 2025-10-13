import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  unit: string;
  color?: string;
}

const StatCard = ({ icon: Icon, label, value, unit, color = "text-primary" }: StatCardProps) => {
  return (
    <Card className="gradient-stat border-none">
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{value}</span>
          <span className="text-sm text-muted-foreground">{unit}</span>
        </div>
      </div>
    </Card>
  );
};

export default StatCard;
