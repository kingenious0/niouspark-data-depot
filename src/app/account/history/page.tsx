"use client";

import OrderHistory from "@/components/admin/order-history";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchUserTransactions, Transaction } from "@/lib/datamart";
import { useAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function AccountHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      redirect("/login");
      return;
    }

    const getOrders = async () => {
      setLoadingOrders(true);
      const userOrders = await fetchUserTransactions(user.uid);
      setOrders(userOrders);
      setLoadingOrders(false);
    };

    getOrders();
  }, [user, authLoading]);

  if (authLoading || !user) {
    return (
      <div className="container mx-auto py-10 px-4 md:px-6">
        <Skeleton className="h-10 w-48 mb-8" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold font-headline mb-8">Purchase History</h1>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Your Orders</CardTitle>
          <CardDescription>
            Here is a list of your recent data bundle purchases.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOrders ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <OrderHistory orders={orders} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
