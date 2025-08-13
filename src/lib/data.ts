
export type Bundle = {
  id: string;
  name: string;
  price: number;
  data: string;
  validity: string;
};

export const bundles: Bundle[] = [
  { id: '1', name: 'Daily Saver', price: 0.99, data: '1 GB', validity: '1 Day' },
  { id: '2', name: 'Weekly Bronze', price: 4.99, data: '5 GB', validity: '7 Days' },
  { id: '3', name: 'Weekly Silver', price: 8.99, data: '15 GB', validity: '7 Days' },
  { id: '4', name: 'Monthly Gold', price: 19.99, data: '50 GB', validity: '30 Days' },
  { id: '5', name: 'Monthly Platinum', price: 29.99, data: '100 GB', validity: '30 Days' },
  { id: '6', name: 'Monthly Diamond', price: 49.99, data: 'Unlimited', validity: '30 Days' },
];

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'customer';
  avatarUrl?: string;
};

export const users: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@niouspark.com', role: 'admin', avatarUrl: 'https://placehold.co/40x40.png' },
];

export type Order = {
  id: string;
  customerName: string;
  phoneNumber: string;
  bundleName: string;
  amount: number;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
};

export const orders: Order[] = [];
