'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ReactNode } from 'react';

type Props = {
  content: string;
  className?: string;
  inline?: boolean;
};

export default function Markdown({ content, className, inline = false }: Props) {
  const components = inline
    ? {
        p: ({ children }: { children: ReactNode }) => <span>{children}</span>,
        code: ({ children }: { children: ReactNode }) => <code>{children}</code>
      }
    : undefined;

  if (inline) {
    return (
      <span className={className}>
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
          {content}
        </ReactMarkdown>
      </span>
    );
  }

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
