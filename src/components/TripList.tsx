import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Trip } from '../types/trip';

const translations = {
  en: {
    noTrips: 'No trips yet',
    delete: 'Delete',
    totalParticipants: 'Total Participants:',
    participants: 'Participants:',
    edit: 'Edit',
  },
  vn: {
    noTrips: 'Chưa có chuyến đi nào',
    delete: 'Xóa',
    totalParticipants: 'Tổng số thành viên:',
    participants: 'Thành viên:',
    edit: 'Sửa',
  },
};

type Translation = (typeof translations)['en'];
const TripList: React.FC<{ trips: Trip[]; onEdit: (trip: Trip) => void; onDelete: (id: string) => void }> = ({
  trips,
  onEdit,
  onDelete,
}) => {
  const [lang, setLang] = useState('en');
  useEffect(() => {
    const handler = (e: CustomEvent<{ lang: string }>) => setLang(e.detail?.lang || 'en');
    window.addEventListener('app:language-changed', handler as EventListener);
    setLang(localStorage.getItem('lang') || 'en');
    return () => window.removeEventListener('app:language-changed', handler as EventListener);
  }, []);
  const t: Translation = translations[lang as 'en' | 'vn'] || translations.en;
  if (!trips.length) return <p>{t.noTrips}</p>;

  return (
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {trips.map((tItem) => (
        <li
          key={tItem.id}
          style={{
            padding: 8,
            border: '1px solid #eee',
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: 12 }}>
            <Link
              to={`/trip/${tItem.id}`}
              style={{ display: 'flex', alignItems: 'center', flex: 1, textDecoration: 'none', color: 'inherit' }}
            >
              <div style={{ flex: 1 }} className="leading-relaxed">
                <h3 className="font-semibold mb-2 text-primary!">{tItem.name}</h3>
                <div>
                  {tItem.startDate && `${tItem.startDate}`} {tItem.endDate ? `— ${tItem.endDate}` : ''}
                </div>
                {/* Show total participants */}
                <div>
                  {t.totalParticipants} {tItem.participants.length}
                </div>
                <div>{tItem.participants.map((p) => p.name).join(', ')}</div>
              </div>
            </Link>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => onEdit(tItem)}
                aria-label={`Edit ${tItem.name}`}
                className="px-2 py-1 rounded bg-success text-on-success hover:bg-success-dark"
              >
                {t.edit}
              </button>
              <button
                onClick={() => onDelete(tItem.id)}
                aria-label={`${t.delete} ${tItem.name}`}
                className="px-2 py-1 rounded bg-danger text-on-danger hover:bg-danger-dark"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default TripList;
