import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Product Manager',
  description:
    'Stateful meeting intelligence that turns transcripts into accountable action items, project memory, and PM-grade Minutes of Meeting.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
