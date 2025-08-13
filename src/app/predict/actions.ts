"use server";

import { analyzeSalesData } from "@/ai/flows/predict-top-bundles";

type State = {
  data: {
    last3Days: {
        totalSales: number;
        totalOrders: number;
        bestSellingBundle: string;
        summary: string;
        totalPendingOrders: number;
    };
    last7Days: {
        totalSales: number;
        totalOrders: number;
        bestSellingBundle: string;
        summary: string;
        totalPendingOrders: number;
    };
    last30Days: {
        totalSales: number;
        totalOrders: number;
        bestSellingBundle: string;
        summary: string;
        totalPendingOrders: number;
    };
  } | null;
  error: string | null;
};

export async function getSalesAnalysis(
  prevState: State,
  formData: FormData
): Promise<State> {
  try {
    const result = await analyzeSalesData();
    return { data: result, error: null };
  } catch (e: any) {
    console.error("Error getting sales analysis:", e);
    return { data: null, error: e.message || "An unexpected error occurred." };
  }
}
