import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useTrips from '../../hooks/useTrips';

const TripPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getById } = useTrips();
  const navigate = useNavigate();
  const trip = id ? getById(id) : null;

  if (!id || !trip) {
    return (
      <main style={{ padding: 16 }}>
        <p>Trip not found.</p>
        <button onClick={() => navigate('/')}>Back</button>
      </main>
    );
  }

  return (
    <main style={{ padding: 16 }}>
      <section style={{ maxWidth: 900, margin: '0 auto' }}>
        <h2>{trip.name}</h2>
        <div style={{ color: '#666', marginBottom: 12 }}>
          {trip.startDate} {trip.endDate ? `— ${trip.endDate}` : ''}
        </div>
        <div style={{ marginBottom: 16 }}>
          <strong>Participants:</strong> {trip.participants.join(', ')}
        </div>

        <section>
          <h3>Expenses</h3>
          <p>Expense UI will be migrated next. Existing app stores per-trip expenses in localStorage under key "expenses{id}".</p>
        </section>
      </section>
    </main>
  );
};

export default TripPage;