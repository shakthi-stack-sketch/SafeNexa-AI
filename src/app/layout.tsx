import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/AuthContext';

export const metadata: Metadata = {
  title: 'SAFENEXA — AI Safety & SIF Precursor Intelligence',
  description: 'AI Safety & SIF Precursor Intelligence Platform for HSE Observation Analysis.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-bg text-content-primary antialiased selection:bg-accent/30 selection:text-content-primary">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
