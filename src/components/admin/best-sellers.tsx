import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const bestSellers = [
    { name: "Monthly Gold", sales: 278, progress: 85 },
    { name: "Weekly Silver", sales: 211, progress: 65 },
    { name: "MTN 5GB", sales: 115, progress: 40 },
    { name: "Daily Saver", sales: 103, progress: 35 },
];

export default function BestSellersCard() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Best Sellers</CardTitle>
                <CardDescription>Top selling products this month.</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {bestSellers.map(item => (
                        <li key={item.name}>
                            <div className="flex justify-between text-sm mb-1">
                                <span>{item.name}</span>
                                <span className="font-medium">{item.sales} sales</span>
                            </div>
                            <Progress value={item.progress} className="h-2" />
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}
