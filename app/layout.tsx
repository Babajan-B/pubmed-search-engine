import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Q Article & Journal Finder',
  description:
    'Search PubMed and filter results to high-impact journals by JIF and quartile rankings. Find quality articles across all research disciplines.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">{children}</body>
    </html>
  );
}
