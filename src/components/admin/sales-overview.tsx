
"use client"

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { DollarSign } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, ResponsiveContainer } from "recharts"
import DashboardCard from "./dashboard-card"

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig

interface SalesCardProps {
    value: number;
}

export default function SalesCard({ value }: SalesCardProps) {
  return (
    <DashboardCard
        title="Total Sales"
        value={value}
        icon={<DollarSign className="text-primary" />}
        change="+15.2%"
        changeType="increase"
        description="from last month"
        className="md:col-span-2"
    >
      <div className="h-32 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
        <ChartContainer config={chartConfig} className="w-full h-full">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted-foreground/20" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.slice(0, 3)}
              className="text-xs"
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          </BarChart>
        </ChartContainer>
        </ResponsiveContainer>
      </div>
    </DashboardCard>
  )
}
