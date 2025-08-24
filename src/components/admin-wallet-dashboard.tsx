"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2, Wallet, Plus, Minus, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { auth } from "@/lib/firebase";

interface WalletTransaction {
  id: string;
  type: 'purchase' | 'topup' | 'refund';
  amount: number;
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

interface WalletData {
  walletBalance: number;
  recentTransactions: WalletTransaction[];
}

export default function AdminWalletDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showTopupForm, setShowTopupForm] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [processingTopup, setProcessingTopup] = useState(false);

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
      const res = await fetch(`/api/admin/wallet-balance?userId=${user.uid}`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setWalletData(data.data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch wallet data",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch wallet data",
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

  const handleTopup = async () => {
    if (!topupAmount || parseFloat(topupAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    setProcessingTopup(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/admin/wallet-topup', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          userId: user?.uid,
          amount: parseFloat(topupAmount),
          description: 'Wallet topup'
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast({
          title: "Topup Successful! 🎉",
          description: `Wallet topped up with GH₵${topupAmount}. New balance: GH₵${data.data.newBalance}`,
        });
        
        // Update local state
        if (walletData) {
          setWalletData({
            ...walletData,
            walletBalance: data.data.newBalance,
            recentTransactions: [
              {
                id: data.data.transactionId,
                type: 'topup',
                amount: parseFloat(topupAmount),
                description: 'Wallet topup',
                balanceBefore: walletData.walletBalance,
                balanceAfter: data.data.newBalance,
                createdAt: new Date().toISOString()
              },
              ...walletData.recentTransactions.slice(0, 9) // Keep only 10 most recent
            ]
          });
        }
        
        setTopupAmount('');
        setShowTopupForm(false);
      } else {
        throw new Error(data.error || "Failed to topup wallet");
      }
    } catch (error: any) {
      toast({
        title: "Topup Failed",
        description: error.message || "Failed to topup wallet",
        variant: "destructive",
      });
    } finally {
      setProcessingTopup(false);
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
        <p className="text-muted-foreground">Failed to load wallet data</p>
        <Button onClick={fetchWalletData} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            Admin Wallet Dashboard
          </CardTitle>
          <CardDescription>
            Manage your wallet balance and view transaction history
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Balance */}
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-bold text-green-600">GH₵{walletData.walletBalance.toFixed(2)}</p>
            </div>
            
            {/* Total Transactions */}
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
              <p className="text-3xl font-bold text-blue-600">{walletData.recentTransactions.length}</p>
            </div>
            
            {/* Actions */}
            <div className="text-center p-4 border rounded-lg">
              <p className="text-sm font-medium text-muted-foreground">Actions</p>
              <div className="flex gap-2 mt-2 justify-center">
                <Button 
                  onClick={() => setShowTopupForm(!showTopupForm)} 
                  size="sm" 
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Topup
                </Button>
                <Button 
                  onClick={refreshWalletData} 
                  size="sm" 
                  variant="outline"
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Topup Form */}
      {showTopupForm && (
        <Card>
          <CardHeader>
            <CardTitle>Topup Wallet</CardTitle>
            <CardDescription>Add funds to your admin wallet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="topupAmount">Amount (GH₵)</Label>
                <Input
                  id="topupAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={topupAmount}
                  onChange={(e) => setTopupAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={handleTopup} 
                  disabled={processingTopup || !topupAmount}
                  className="flex-1"
                >
                  {processingTopup && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  <Plus className="w-4 h-4 mr-2" />
                  Topup Wallet
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowTopupForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest wallet activity</CardDescription>
        </CardHeader>
        <CardContent>
          {walletData.recentTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {walletData.recentTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'topup' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/20' 
                        : transaction.type === 'purchase'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/20'
                        : 'bg-orange-100 text-orange-600 dark:bg-orange-900/20'
                    }`}>
                      {transaction.type === 'topup' ? (
                        <Plus className="w-4 h-4" />
                      ) : transaction.type === 'purchase' ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.type === 'topup' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'topup' ? '+' : '-'}GH₵{transaction.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Balance: GH₵{transaction.balanceAfter.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
