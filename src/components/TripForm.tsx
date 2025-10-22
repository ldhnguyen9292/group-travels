import React, { useState } from 'react';
import type { Trip } from '../types';

type Props = {
    onAdd: (data: Omit<Trip, 'id' | 'createdAt'>) => void
}

const TripForm: React.FC<Props> = ({ onAdd }) => {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(true);

  function addParticipantFromInput() {
    const v = participantInput.trim();
    if (!v) return;
    const list = v.split(',').map((s) => s.trim()).filter(Boolean);
    setParticipants((p) => Array.from(new Set([...p, ...list])));
    setParticipantInput('');
  }

  function removeParticipant(idx: number) {
    setParticipants((p) => p.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      participants,
    });
    setName('');
    setStartDate('');
    setEndDate('');
    setParticipants([]);
    setParticipantInput('');
    setShowForm(false);
    setTimeout(() => setShowForm(true), 100); // small UI reset
  }

  return (
    <section style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <h3 style={{ margin: 0 }}>Create trip</h3>
        <button onClick={() => setShowForm((s) => !s)} aria-expanded={showForm}>
          {showForm ? 'Hide' : 'Show'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input placeholder="Trip name" value={name} onChange={(e) => setName(e.target.value)} />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <input
              placeholder="Add participants (comma separated)"
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addParticipantFromInput();
                }
              }}
              style={{ minWidth: 220 }}
            />
            <button type="button" onClick={addParticipantFromInput}>
                            Add
            </button>
            <button type="submit">Save trip</button>
          </div>

          {participants.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <strong>Participants:</strong>
              <ul style={{ paddingLeft: 16 }}>
                {participants.map((p, i) => (
                  <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <span>{p}</span>
                    <button type="button" onClick={() => removeParticipant(i)} aria-label={`Remove ${p}`}>
                                            ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      )}
    </section>
  );
};

export default TripForm;