"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2, Wallet, RefreshCw, ShoppingCart, ExternalLink, CheckCircle, XCircle, Clock } from "lucide-react";
import { auth } from "@/lib/firebase";

interface DatamartTransaction {
  id: string;
  type: 'purchase';
  amount: number;
  description: string;
  network: string;
  bundleName: string;
  phoneNumber: string;
  status: string;
  reference: string;
  datamartTransactionId: string;
  createdAt: string;
}

interface DatamartWalletData {
  datamartBalance: number;
  totalTransactions: number;
  recentTransactions: DatamartTransaction[];
  isDatamartMirrored: boolean;
}

export default function AdminWalletDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [walletData, setWalletData] = useState<DatamartWalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      console.log("Fetching DataMart wallet balance for user:", user.uid);
      
      const res = await fetch(`/api/admin/wallet-balance?userId=${user.uid}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      console.log("DataMart wallet API response status:", res.status);
      
      const data = await res.json();
      console.log("DataMart wallet API response data:", data);
      
      if (data.success) {
        setWalletData(data.data);
        toast({
          title: "✅ DataMart Balance Synced",
          description: `Current balance: GH₵${data.data.datamartBalance.toFixed(2)}`,
        });
      } else {
        console.error("DataMart wallet API error:", data.error);
        toast({
          title: "DataMart Sync Error",
          description: data.error || "Failed to sync with DataMart wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch DataMart wallet data:", error);
      toast({
        title: "Connection Error",
        description: "Failed to connect to DataMart API",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshWalletData = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
      case 'delivery_failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
      case 'delivering':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed':
      case 'delivery_failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
      case 'delivering':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load DataMart wallet data</p>
        <Button onClick={fetchWalletData} variant="outline" className="mt-2">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* DataMart Wallet Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            DataMart Wallet Balance
            <Badge variant="outline" className="ml-2">
              <ExternalLink className="w-3 h-3 mr-1" />
              Live Mirror
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time balance from your DataMart account with transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current DataMart Balance */}
            <div className="text-center p-6 border rounded-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
              <p className="text-sm font-medium text-muted-foreground">DataMart Balance</p>
              <p className="text-3xl font-bold text-green-600">GH₵{walletData.datamartBalance.toFixed(2)}</p>
              <p className="text-xs text-green-600 mt-1">Real-time from DataMart API</p>
            </div>
            
            {/* Total Transactions */}
            <div className="text-center p-6 border rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
              <p className="text-3xl font-bold text-blue-600">{walletData.totalTransactions}</p>
              <p className="text-xs text-muted-foreground mt-1">Bundle purchases logged</p>
            </div>
            
            {/* Sync Status & Actions */}
            <div className="text-center p-6 border rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Sync Status</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-600">Connected</span>
              </div>
              <Button 
                onClick={refreshWalletData} 
                size="sm" 
                variant="outline"
                disabled={refreshing}
                className="mt-3"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh Balance
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Transaction History
          </CardTitle>
          <CardDescription>
            Bundle purchases from your DataMart account (synced with local records)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {walletData.recentTransactions.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Purchase bundles to see transaction history here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {walletData.recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/20">
                      <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{transaction.bundleName || 'Data Bundle'}</p>
                        <Badge variant="outline" className="text-xs">
                          {transaction.network}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        To: {transaction.phoneNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <p className="font-bold text-red-600">
                      -GH₵{transaction.amount.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getStatusColor(transaction.status)}`}
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ref: {transaction.reference}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                DataMart Integration Active
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-200 mt-1">
                This dashboard mirrors your real DataMart wallet balance. All bundle purchases are deducted directly from your DataMart account and tracked here for reporting purposes.
              </p>
              <div className="mt-2 space-y-1 text-xs text-blue-600 dark:text-blue-300">
                <p>• Balance is fetched in real-time from DataMart API</p>
                <p>• Transactions are logged locally for audit trail</p>
                <p>• No virtual wallet or manual top-ups required</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
