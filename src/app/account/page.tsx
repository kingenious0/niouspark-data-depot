"use client";

import { ProfileForm } from "@/components/account/profile-form";
import OrderHistory from "@/components/admin/order-history";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchUserTransactions, Transaction } from "@/lib/datamart";
import { useAuth } from "@/lib/auth";
import { useEffect, useState, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { redirect, useSearchParams } from "next/navigation";

function AccountPageComponent() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Transaction[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get('payment_status');
  
  const defaultTab = paymentStatus ? "history" : "profile";

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
            <Skeleton className="h-10 w-full max-w-md mb-6" />
            <Skeleton className="h-64 w-full" />
        </div>
    )
  }
  
  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <h1 className="text-3xl font-bold font-headline mb-8">My Account</h1>
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="history">Purchase History</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" className="mt-6">
          <ProfileForm />
        </TabsContent>
        <TabsContent value="history" className="mt-6">
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AccountPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64">Loading...</div>}>
            <AccountPageComponent />
        </Suspense>
    )
}