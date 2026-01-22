import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { AdminTransaction } from "@/lib/datamart";
import { useMemo } from "react";

interface BestSellersCardProps {
    orders?: AdminTransaction[];
}

export default function BestSellersCard({ orders = [] }: BestSellersCardProps) {
    const bestSellers = useMemo(() => {
        if (!orders || orders.length === 0) return [];

        // Group by bundle name (or generic type if name missing)
        const salesMap = orders.reduce((acc, order) => {
            // Only count completed purchases
            if (order.status !== 'completed' && order.status !== 'success') return acc;

            const name = order.bundleName || order.type || 'Unknown Bundle';
            acc[name] = (acc[name] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Convert to array and sort
        const sortedSales = Object.entries(salesMap)
            .map(([name, sales]) => ({ name, sales }))
            .sort((a, b) => b.sales - a.sales)
            .slice(0, 5); // Top 5

        if (sortedSales.length === 0) return [];

        const maxSales = sortedSales[0].sales;

        return sortedSales.map(item => ({
            ...item,
            progress: (item.sales / maxSales) * 100
        }));
    }, [orders]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Best Sellers</CardTitle>
                <CardDescription>Top selling products based on transaction history.</CardDescription>
            </CardHeader>
            <CardContent>
                {bestSellers.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                        No sales data available yet.
                    </div>
                ) : (
                    <ul className="space-y-5">
                        {bestSellers.map(item => (
                            <li key={item.name}>
                                <div className="flex justify-between text-sm mb-2 items-center">
                                    <span className="font-medium truncate max-w-[70%]">{item.name}</span>
                                    <span className="text-muted-foreground">{item.sales} sold</span>
                                </div>
                                <Progress value={item.progress} className="h-2" />
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}
