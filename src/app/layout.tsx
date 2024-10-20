import { Inter } from 'next/font/google';
import '../styles/globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { Analytics } from "@vercel/analytics/react";

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}

// Remove the ErrorBoundary class from this file

