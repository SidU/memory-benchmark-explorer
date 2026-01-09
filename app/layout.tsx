import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Memory Benchmark Explorer',
  description: 'Explore long-context benchmarks, take tests, and share your score.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
