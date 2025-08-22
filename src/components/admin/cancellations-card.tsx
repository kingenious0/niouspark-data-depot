"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { AdminTransaction } from "@/lib/datamart";

interface CancellationsCardProps {
    orders: AdminTransaction[];
}

const chartConfig = {
  paymentFailed: {
    label: "Payment Failed",
    color: "hsl(var(--primary))",
  },
  userCancelled: {
    label: "User Cancelled", 
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export default function CancellationsCard({ orders }: CancellationsCardProps) {
    const failedOrders = orders.filter(o => o.status === 'failed');
    const userCancelled = Math.round(failedOrders.length * 0.3); // Dummy data
    const paymentFailed = failedOrders.length - userCancelled;

    const data = [
        { name: "Payment Failed", value: paymentFailed, fill: "var(--color-paymentFailed)" },
        { name: "User Cancelled", value: userCancelled, fill: "var(--color-userCancelled)" },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cancellations</CardTitle>
                <CardDescription>Breakdown of failed orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-48">
                    <ChartContainer config={chartConfig} className="w-full h-full [&>div]:aspect-auto [&>div]:h-full">
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie 
                                data={data} 
                                dataKey="value" 
                                nameKey="name" 
                                cx="50%" 
                                cy="50%" 
                                outerRadius={60} 
                                innerRadius={40}
                            />
                        </PieChart>
                    </ChartContainer>
                </div>
                 <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-paymentFailed)" }}></span>
                            <span>Payment Failed</span>
                       </div>
                       <span className="font-medium">{paymentFailed}</span>
                    </div>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-userCancelled)" }}></span>
                            <span>User Cancelled</span>
                       </div>
                       <span className="font-medium">{userCancelled}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}