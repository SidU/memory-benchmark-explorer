'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

type Props = {
  content: string;
  className?: string;
  inline?: boolean;
};

export default function Markdown({ content, className, inline = false }: Props) {
  const inlineComponents: Components = {
    p: ({ node: _node, children, ...props }) => <span {...props}>{children}</span>,
    code: ({ node: _node, className, children, ...props }) => (
      <code className={className} {...props}>
        {children}
      </code>
    )
  };

  const components = inline ? inlineComponents : undefined;

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
