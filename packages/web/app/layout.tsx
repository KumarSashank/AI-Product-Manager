import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Product Manager | Meeting Memory for Execution Teams',
  description:
    'Turn meetings into decisions, owners, next steps, and cross-meeting project memory from one product workspace.',
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
