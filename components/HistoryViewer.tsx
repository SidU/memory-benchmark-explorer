'use client';

import { useMemo, useState } from 'react';
import type { Session } from '../lib/types';
import Markdown from './Markdown';

type Props = {
  sessions: Session[];
};

const parseSpeaker = (content: string) => {
  const match = content.match(/^\s*\[([^\]]+)\]:\s*/);
  if (match) {
    return {
      speaker: match[1].trim(),
      text: content.slice(match[0].length).trimStart()
    };
  }
  return { speaker: null, text: content };
};

export default function HistoryViewer({ sessions }: Props) {
  const [search, setSearch] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const normalizedSearch = search.trim().toLowerCase();

  const filteredSessions = useMemo(() => {
    if (!normalizedSearch) {
      return sessions;
    }
    return sessions
      .map((session) => ({
        ...session,
        turns: session.turns.filter((turn) =>
          turn.content.toLowerCase().includes(normalizedSearch)
        )
      }))
      .filter((session) => session.turns.length > 0);
  }, [sessions, normalizedSearch]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="label">History search</div>
        <span className="tag">{sessions.length} sessions</span>
      </div>
      <input
        className="input"
        placeholder="Search the history"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div className="history" style={{ marginTop: 16 }}>
        {filteredSessions.length === 0 && (
          <p className="notice">No history matches this search.</p>
        )}
        {filteredSessions.map((session, index) => {
          const isCollapsed = collapsed[session.id] ?? false;
          return (
            <div key={session.id} style={{ marginBottom: 16 }}>
              <div className="session-header">
                <div>
                  Session {index + 1}
                  {session.title ? ` · ${session.title}` : ''}
                  {session.date ? ` · ${session.date}` : ''}
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [session.id]: !isCollapsed
                    }))
                  }
                >
                  {isCollapsed ? 'Expand' : 'Collapse'}
                </button>
              </div>
              {!isCollapsed &&
                session.turns.map((turn, turnIndex) => (
                  <div
                    key={`${session.id}-${turnIndex}`}
                    className={`turn ${turn.role === 'assistant' ? 'assistant' : ''}`}
                  >
                    {(() => {
                      const { speaker, text } = parseSpeaker(turn.content);
                      const label = speaker || turn.role.toUpperCase();
                      return (
                        <>
                          <strong>{label}</strong>
                          <div style={{ margin: '8px 0 0' }}>
                            <Markdown content={text} className="markdown" />
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
