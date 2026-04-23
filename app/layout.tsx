import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { Toaster } from 'sonner';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import { SplashScreen } from '@/components/splash/SplashScreen';
import { CartDrawer } from '@/components/store/CartDrawer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: {
    default: 'Vee Lifestyle — Premium Fashion Kenya',
    template: '%s | Vee Lifestyle',
  },
  description:
    'Shop premium lifestyle fashion — shoes and apparel for men, women, and everyone. Fast delivery across Kenya. Secure M-Pesa checkout.',
  keywords: ['fashion kenya', 'shoes kenya', 'lifestyle apparel', 'online shopping kenya', 'mpesa checkout'],
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_KE',
    siteName: 'Vee Lifestyle',
    title: 'Vee Lifestyle — Premium Fashion Kenya',
    description: 'Shop premium lifestyle fashion with M-Pesa checkout and same-day delivery.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vee Lifestyle',
    description: 'Premium lifestyle fashion. Shop now.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
            rel="stylesheet"
          />
          <link
            rel="stylesheet"
            href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
            integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
            crossOrigin=""
          />
        </head>
        <body>
          <SplashScreen />
          <CartDrawer />
          {children}

          {/* Global Toast Notifications */}
          <Toaster
            position="top-right"
            expand={false}
            richColors
            toastOptions={{
              style: {
                background: 'rgba(255, 255, 255, 0.92)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(14, 165, 233, 0.2)',
                borderRadius: '14px',
                color: '#0a1628',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '500',
                boxShadow: '0 8px 32px rgba(14, 165, 233, 0.15)',
              },
            }}
          />

          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}
