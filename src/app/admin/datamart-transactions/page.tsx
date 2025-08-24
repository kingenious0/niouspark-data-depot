import DatamartTransactionsDashboard from '@/components/datamart-transactions-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datamart Transactions - Niouspark Data Depot',
  description: 'View Datamart API transactions and admin purchase logs',
};

export default function DatamartTransactionsPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight">
            Datamart Transactions
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
            Monitor all Datamart API transactions and admin purchase activities.
          </p>
        </div>
        
        <DatamartTransactionsDashboard />
      </div>
    </div>
  );
}
