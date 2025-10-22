import React from 'react';
import TripForm from '../../components/TripForm';
import TripList from '../../components/TripList';
import useTrips from '../../hooks/useTrips';

const Home: React.FC = () => {
  const { trips, addTrip, deleteTrip } = useTrips();

  return (
    <main>
      <section className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Trips</h2>

        <div className="mb-6">
          <TripForm onAdd={(data) => addTrip(data)} />
        </div>

        <div>
          <TripList trips={trips} onDelete={deleteTrip} />
        </div>
      </section>
    </main>
  );
};

export default Home;