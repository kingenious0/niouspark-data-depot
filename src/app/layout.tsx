import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { ThemeProvider } from '@/components/theme-provider';
import AppLoadingWrapper from '@/components/app-loading-wrapper';

export const metadata: Metadata = {
  title: {
    default: 'Niouspark Data Depot | Best Data Plug in Ghana',
    template: '%s | Niouspark Data Depot',
  },
  description: 'Buy cheap MTN, Telecel, and AirtelTigo data bundles in Ghana. Non-expiry, instant delivery, and secure payments. Join thousands of happy customers today.',
  keywords: ['Ghana data bundles', 'cheap data', 'MTN non-expiry', 'Telecel data', 'AirtelTigo data', 'Niouspark', 'internet data Ghana'],
  authors: [{ name: 'Niouspark Data Depot' }],
  openGraph: {
    type: 'website',
    locale: 'en_GH',
    url: 'https://niouspark-data-depot.vercel.app',
    title: 'Niouspark Data Depot | Best Data Plug in Ghana',
    description: 'Buy cheap MTN, Telecel, and AirtelTigo data bundles in Ghana. Non-expiry, instant delivery.',
    siteName: 'Niouspark Data Depot',
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          'flex flex-col'
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppLoadingWrapper>
            <Header />
            <main className="flex-grow flex flex-col">{children}</main>
            <Footer />
          </AppLoadingWrapper>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
