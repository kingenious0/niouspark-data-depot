"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { getSalesAnalysis } from '../../actions';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Lightbulb, Loader2, CalendarDays, Hourglass } from "lucide-react";

const initialState = {
  data: null,
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full max-w-sm mx-auto">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        "Generate Sales Analysis"
      )}
    </Button>
  );
}

interface PeriodAnalysisProps {
    title: string;
    data: {
        totalSales: number;
        totalOrders: number;
        bestSellingBundle: string;
        summary: string;
        totalPendingOrders: number;
    };
}

function PeriodAnalysisCard({ title, data }: PeriodAnalysisProps) {
    return (
        <Card className="shadow-lg animate-in fade-in-50">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <CalendarDays className="text-primary" />
                    {title}
                </CardTitle>
                <CardDescription>
                    Analysis of the sales activity for this period.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-muted p-3 rounded-lg">
                        <p className="text-muted-foreground">Total Sales</p>
                        <p className="font-bold text-lg">GH₵{data.totalSales.toFixed(2)}</p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                        <p className="text-muted-foreground">Completed Orders</p>
                        <p className="font-bold text-lg">{data.totalOrders}</p>
                    </div>
                </div>
                 <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground flex items-center gap-1"><Hourglass className="h-4 w-4" /> Pending Orders</p>
                    <p className="font-bold text-lg">{data.totalPendingOrders}</p>
                </div>
                 <div className="bg-muted p-3 rounded-lg">
                    <p className="text-muted-foreground">Best Selling Bundle</p>
                    <p className="font-bold text-lg">{data.bestSellingBundle}</p>
                </div>
                <div>
                    <h4 className="font-semibold flex items-center gap-2 mb-1"><Lightbulb className="text-accent-foreground h-4 w-4" /> AI Summary</h4>
                    <p className="text-muted-foreground leading-relaxed">
                        {data.summary}
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}

export function PredictionClient() {
  const [state, formAction] = useActionState(getSalesAnalysis, initialState);

  return (
    <div className="space-y-8">
      <Card className="shadow-lg text-center">
        <CardHeader>
          <CardTitle className="font-headline">One-Click Sales Analysis</CardTitle>
          <CardDescription>
            Click the button below to get a real-time sales analysis from your store's data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction}>
            <SubmitButton />
          </form>
        </CardContent>
      </Card>
      
      <div className="space-y-8">
        {state.error && (
          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}
        {state.data && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <PeriodAnalysisCard title="Last 3 Days" data={state.data.last3Days} />
            <PeriodAnalysisCard title="Last 7 Days" data={state.data.last7Days} />
            <PeriodAnalysisCard title="Last 30 Days" data={state.data.last30Days} />
          </div>
        )}
      </div>
    </div>
  );
}
