
"use client";

import { useState, useEffect } from "react";
import OrderHistory from "@/components/admin/order-history";
import SalesCard from "@/components/admin/sales-card";
import { DollarSign, Package, CreditCard, Users, ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import AovCard from "@/components/admin/aov-overview";
import BestSellersCard from "@/components/admin/best-sellers";
import CancellationsCard from "@/components/admin/cancellations-card";
import DashboardCard from "@/components/admin/dashboard-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import type { AdminTransaction } from "@/lib/datamart";

export default function AdminDashboardPage() {
  const [allOrders, setAllOrders] = useState<AdminTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/admin/get-transactions');
            const data = await res.json();
            if (res.ok && data.success) {
                setAllOrders(data.transactions);
            } else {
                throw new Error(data.error || 'Failed to fetch transactions');
            }
        } catch (error: any) {
            toast({
                title: 'Error fetching data',
                description: error.message,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }
    fetchData();
  }, [toast]);

  const handleDeleteTransactions = async () => {
    setIsDeleting(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch('/api/admin/clear-transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete transactions.');
      }

      toast({
        title: "Success",
        description: "All transactions have been deleted.",
      });
      setAllOrders([]); // Clear orders from state
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const recentOrders = allOrders.slice(0, 5);
  const completedOrders = allOrders.filter(o => o.status === 'completed');
  const totalSales = completedOrders.reduce((sum, o) => sum + o.amount, 0);
  const totalCompletedOrders = completedOrders.length;
  const aov = totalSales / (totalCompletedOrders || 1);
  const totalCustomers = new Set(allOrders.map(o => o.userId)).size;
  const pendingOrders = allOrders.filter(o => o.status === 'pending' || o.status === 'send_otp' || o.status === 'send_pin');
  const failedOrders = allOrders.filter(o => o.status === 'failed');


  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 lg:p-8">
       <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold font-headline">Admin Dashboard</h1>
        <div className="flex gap-2 items-center flex-wrap">
            <Button asChild>
                <Link href="/bundles">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Purchase Bundle
                </Link>
            </Button>
            <Button asChild variant="outline">
                <Link href="/admin/users">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Users
                </Link>
            </Button>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All Transactions
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all
                    transaction history from the database.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteTransactions} disabled={isDeleting}>
                    {isDeleting && <Loader2 className="animate-spin mr-2"/>}
                    Yes, delete everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </div>
       {loading ? <div className="text-center p-10">Loading dashboard data...</div> : (
        <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <SalesCard value={totalSales} />
        <AovCard value={aov} />
         <DashboardCard
            title="Total Customers"
            value={totalCustomers.toString()}
            icon={<Users className="text-primary" />}
            change="+12.5%"
            changeType="increase"
            description="from last month"
          />
          <DashboardCard
            title="Completed Orders"
            value={totalCompletedOrders.toString()}
            icon={<Package className="text-primary" />}
            change="+8.1%"
            changeType="increase"
            description="from last month"
          />
           <DashboardCard
            title="Pending Payments"
            value={pendingOrders.length.toString()}
            icon={<CreditCard className="text-primary" />}
          />
           <DashboardCard
            title="Failed Payments"
            value={failedOrders.length.toString()}
            icon={<CreditCard className="text-destructive" />}
          />
      </div>
      <div className="grid gap-6 mt-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
            <Card>
            <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>A list of the most recent transactions.</CardDescription>
            </CardHeader>
            <CardContent>
                <OrderHistory orders={recentOrders} />
            </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <BestSellersCard />
            <CancellationsCard orders={allOrders} />
        </div>
      </div>
      </>
      )}
    </div>
  );
}
