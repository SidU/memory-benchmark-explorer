import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'LongMemEval Human Scoring',
  description: 'Run a LongMemEval human test and share your score.'
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
