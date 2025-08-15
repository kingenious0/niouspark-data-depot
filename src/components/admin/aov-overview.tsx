import DashboardCard from "./dashboard-card";
import { TrendingUp } from "lucide-react";

interface AovCardProps {
    value: number;
}

export default function AovCard({ value }: AovCardProps) {
    return (
        <DashboardCard
            title="Average Order Value"
            value={value}
            icon={<TrendingUp className="text-primary" />}
            change="+5.2%"
            changeType="increase"
            description="from last month"
        />
    );
}