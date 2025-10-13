import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface SportCardProps {
  icon: LucideIcon;
  name: string;
  description: string;
  color: string;
  onClick: () => void;
}

const SportCard = ({ icon: Icon, name, description, color, onClick }: SportCardProps) => {
  return (
    <Card
      className="group cursor-pointer overflow-hidden border-2 hover:border-primary transition-smooth hover:shadow-lg"
      onClick={onClick}
    >
      <div className="p-6 space-y-4">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${color} transition-smooth group-hover:scale-110`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </Card>
  );
};

export default SportCard;
