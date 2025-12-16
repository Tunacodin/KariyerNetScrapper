import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kariyer.net İlan Viewer',
  description: 'Realtime CSV viewer for job listings',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
