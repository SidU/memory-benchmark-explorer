'use client';

import { useMemo, useState } from 'react';
import type { Session } from '../lib/types';

type Props = {
  sessions: Session[];
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
                    <strong>{turn.role.toUpperCase()}</strong>
                    <p style={{ margin: '8px 0 0' }}>{turn.content}</p>
                  </div>
                ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
