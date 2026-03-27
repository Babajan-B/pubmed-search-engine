import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScholaraBB',
  description:
    'ScholaraBB — search PubMed and filter results to high-impact journals by JIF and quartile rankings across all disciplines.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
