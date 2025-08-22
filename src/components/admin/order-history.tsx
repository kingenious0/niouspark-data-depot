import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import type { Transaction } from "@/lib/datamart";
import { format } from 'date-fns';
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

interface OrderHistoryProps {
  orders: Transaction[];
  minimal?: boolean;
  isSuperAdmin?: boolean;
  onTransactionDeleted?: (transactionId: string) => void;
}

export default function OrderHistory({ orders, minimal = false, isSuperAdmin = false, onTransactionDeleted }: OrderHistoryProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const handleDeleteTransaction = async (transactionId: string) => {
    setDeletingIds(prev => new Set([...prev, transactionId]));
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        throw new Error("Authentication token not found.");
      }

      const response = await fetch('/api/admin/delete-transaction', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ transactionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete transaction.');
      }

      toast({
        title: "Success",
        description: `Transaction ${transactionId.slice(0, 8)}... has been deleted.`,
      });
      
      // Call the callback to update the parent component
      if (onTransactionDeleted) {
        onTransactionDeleted(transactionId);
      }
    } catch (error: any) {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(transactionId);
        return newSet;
      });
    }
  };
  const getBadgeVariant = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'pending':
      case 'delivering':
        return 'secondary';
      case 'failed':
      case 'delivery_failed':
      case 'abandoned':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reference</TableHead>
            {!minimal && <TableHead>Phone Number</TableHead>}
            <TableHead>Bundle</TableHead>
            <TableHead>Amount (GH₵)</TableHead>
            {!minimal && <TableHead>Date</TableHead>}
            <TableHead>Status</TableHead>
            {isSuperAdmin && <TableHead className="w-[50px]">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order._id}>
              <TableCell className="font-medium">#{order.reference.slice(0, 7)}...</TableCell>
              {!minimal && <TableCell>{order.phoneNumber || 'N/A'}</TableCell>}
              <TableCell>{order.bundleName || order.type}</TableCell>
              <TableCell>{order.amount.toFixed(2)}</TableCell>
              {!minimal && <TableCell>{format(new Date(order.createdAt), "PPp")}</TableCell>}
              <TableCell>
                <Badge variant={getBadgeVariant(order.status)} className="capitalize">
                  {order.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              {isSuperAdmin && (
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        disabled={deletingIds.has(order._id)}
                        className="h-8 w-8 p-0"
                      >
                        {deletingIds.has(order._id) ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Transaction Record</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete transaction #{order.reference}?
                          <br />
                          <span className="font-semibold">This action cannot be undone.</span>
                          <br /><br />
                          <span className="text-sm text-muted-foreground">
                            Bundle: {order.bundleName} | Amount: GH₵{order.amount.toFixed(2)} | Status: {order.status}
                          </span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeleteTransaction(order._id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete Transaction
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}