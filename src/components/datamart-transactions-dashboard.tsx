"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { Loader2, RefreshCw, ExternalLink, Wallet, CreditCard, Calendar, Phone, Network } from "lucide-react";
import { auth } from "@/lib/firebase";

interface DatamartTransaction {
  _id: string;
  userId: string;
  type: string;
  amount: number;
  status: string;
  reference: string;
  gateway: string;
  createdAt: string;
  updatedAt: string;
}

interface LocalAdminTransaction {
  id: string;
  reference: string;
  phoneNumber: string;
  bundleName: string;
  amount: number;
  network: string;
  capacity: string;
  status: string;
  gateway: string;
  paymentMethod: string;
  createdAt: string;
  datamartPurchaseId: string;
  datamartTransactionRef: string;
  datamartRemainingBalance: number;
}

interface DatamartTransactionsData {
  datamartTransactions: DatamartTransaction[];
  localAdminTransactions: LocalAdminTransaction[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

export default function DatamartTransactionsDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transactionsData, setTransactionsData] = useState<DatamartTransactionsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user, currentPage]);

  const fetchTransactions = async () => {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch(`/api/admin/datamart-transactions?userId=${user.uid}&page=${currentPage}&limit=20`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setTransactionsData(data.data);
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch transactions",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshTransactions = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGatewayIcon = (gateway: string) => {
    return gateway === 'wallet' ? (
      <Wallet className="w-4 h-4 text-green-600" />
    ) : (
      <CreditCard className="w-4 h-4 text-blue-600" />
    );
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'failed':
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!transactionsData) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Failed to load transactions</p>
        <Button onClick={fetchTransactions} variant="outline" className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-6 h-6 text-blue-600" />
            Datamart Transactions Dashboard
          </CardTitle>
          <CardDescription>
            View all Datamart API transactions and local admin purchase logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Total Transactions: {transactionsData.pagination.totalItems}
            </div>
            <Button 
              onClick={refreshTransactions} 
              variant="outline" 
              size="sm"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Datamart Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Datamart API Transactions</CardTitle>
          <CardDescription>Direct transactions from Datamart API</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsData.datamartTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No Datamart transactions found</p>
          ) : (
            <div className="space-y-3">
              {transactionsData.datamartTransactions.map((transaction) => (
                <div 
                  key={transaction._id} 
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getGatewayIcon(transaction.gateway)}
                    <div>
                      <p className="font-medium">{transaction.type}</p>
                      <p className="text-sm text-muted-foreground">
                        Ref: {transaction.reference}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">GH₵{transaction.amount.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(transaction.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Local Admin Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Local Admin Purchase Logs</CardTitle>
          <CardDescription>Admin purchases processed through Niouspark</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsData.localAdminTransactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No local admin transactions found</p>
          ) : (
            <div className="space-y-3">
              {transactionsData.localAdminTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getGatewayIcon(transaction.gateway)}
                      <span className="font-medium">{transaction.bundleName}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span>{transaction.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Network className="w-3 h-3 text-muted-foreground" />
                      <span>{transaction.network}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span>{formatDate(transaction.createdAt)}</span>
                    </div>
                    <div className="text-right font-bold text-green-600">
                      GH₵{transaction.amount.toFixed(2)}
                    </div>
                  </div>
                  
                  {transaction.datamartPurchaseId && (
                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                      <p><strong>Datamart ID:</strong> {transaction.datamartPurchaseId}</p>
                      <p><strong>Transaction Ref:</strong> {transaction.datamartTransactionRef}</p>
                      {transaction.datamartRemainingBalance && (
                        <p><strong>Remaining Balance:</strong> GH₵{transaction.datamartRemainingBalance.toFixed(2)}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {transactionsData.pagination.totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {transactionsData.pagination.totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(transactionsData.pagination.totalPages, prev + 1))}
                disabled={currentPage === transactionsData.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
