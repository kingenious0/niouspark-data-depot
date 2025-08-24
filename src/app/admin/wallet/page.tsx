import AdminWalletDashboard from '@/components/admin-wallet-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Wallet - Niouspark Data Depot',
  description: 'Manage your admin wallet balance and transactions',
};

export default function AdminWalletPage() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-headline tracking-tight">
            Admin Wallet Management
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-lg text-muted-foreground">
            Manage your wallet balance, view transactions, and topup funds.
          </p>
        </div>
        
        <AdminWalletDashboard />
      </div>
    </div>
  );
}
