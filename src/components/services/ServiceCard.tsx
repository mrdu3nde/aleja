import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Clock } from "lucide-react";

type ServiceCardProps = {
  name: string;
  description: string;
  idealFor: string;
  duration: string;
  price: string;
};

export function ServiceCard({
  name,
  description,
  idealFor,
  duration,
  price,
}: ServiceCardProps) {
  return (
    <Card hover className="h-full flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-text-dark">{name}</h3>
        <Badge>{price}</Badge>
      </div>
      <p className="text-text-light text-sm leading-relaxed mb-3">
        {description}
      </p>
      <p className="text-text-muted text-xs italic mb-3">{idealFor}</p>
      <div className="mt-auto flex items-center gap-1.5 text-text-muted text-xs">
        <Clock className="h-3.5 w-3.5" />
        <span>{duration}</span>
      </div>
    </Card>
  );
}
