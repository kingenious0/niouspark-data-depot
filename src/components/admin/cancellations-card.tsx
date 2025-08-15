"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { AdminTransaction } from "@/lib/datamart";

interface CancellationsCardProps {
    orders: AdminTransaction[];
}

export default function CancellationsCard({ orders }: CancellationsCardProps) {
    const failedOrders = orders.filter(o => o.status === 'failed');
    const userCancelled = Math.round(failedOrders.length * 0.3); // Dummy data
    const paymentFailed = failedOrders.length - userCancelled;

    const data = [
        { name: "Payment Failed", value: paymentFailed, color: "hsl(var(--primary))" },
        { name: "User Cancelled", value: userCancelled, color: "hsl(var(--chart-2))" },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Cancellations</CardTitle>
                <CardDescription>Breakdown of failed orders.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-48 flex items-center justify-center">
                   <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    borderColor: 'hsl(var(--border))'
                                }}
                            />
                            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={40}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                 <div className="mt-4 space-y-2 text-sm">
                    {data.map(item => (
                        <div key={item.name} className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }}></span>
                                <span>{item.name}</span>
                           </div>
                           <span className="font-medium">{item.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}