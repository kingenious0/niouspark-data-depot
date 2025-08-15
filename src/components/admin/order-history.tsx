import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@/lib/datamart";
import { format } from 'date-fns';

interface OrderHistoryProps {
  orders: Transaction[];
  minimal?: boolean;
}

export default function OrderHistory({ orders, minimal = false }: OrderHistoryProps) {
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}