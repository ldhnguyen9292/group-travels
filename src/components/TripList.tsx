import React from 'react';
import { Link } from 'react-router-dom';
import type { Trip } from '../types';

type Props = {
    trips: Trip[]
    onDelete: (id: string) => void
}

const TripList: React.FC<Props> = ({ trips, onDelete }) => {
  if (!trips.length) return <p>No trips yet</p>;

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {trips.map((t) => (
        <li key={t.id} style={{ padding: 8, border: '1px solid #eee', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Link to={`/trip/${t.id}`}><strong>{t.name}</strong></Link>
            <div style={{ fontSize: 13, color: '#555' }}>
              {t.startDate && `${t.startDate}`} {t.endDate ? `— ${t.endDate}` : ''}
            </div>
            <div style={{ fontSize: 13, color: '#666' }}>{t.participants.join(', ')}</div>
          </div>
          <div>
            <button onClick={() => onDelete(t.id)} aria-label={`Delete ${t.name}`}>Delete</button>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TripList;