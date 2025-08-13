import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: string;
  changeType?: 'increase' | 'decrease';
  description?: string;
  className?: string;
  children?: React.ReactNode;
}

export default function DashboardCard({ title, value, icon, change, changeType, description, className, children }: DashboardCardProps) {
  const isCurrency = typeof value === 'number';
  const formattedValue = isCurrency ? `GH₵${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value;

  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between">
        <div>
            <div className="text-3xl font-bold">{formattedValue}</div>
            {change && description && changeType && (
                 <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <span className={cn("flex items-center gap-1", changeType === 'increase' ? 'text-green-500' : 'text-red-500')}>
                        {changeType === 'increase' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        {change}
                    </span>
                    {description}
                </p>
            )}
        </div>
        {children && <div className="mt-4">{children}</div>}
      </CardContent>
    </Card>
  );
}
