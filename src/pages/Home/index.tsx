import React, { useEffect, useState } from 'react';
import Loading from '../../components/Loading';
import TripForm from '../../components/TripForm';
import TripList from '../../components/TripList';
import useTrips from '../../hooks/useTrips';
import type { Trip } from '../../types/trip';
import { getOrCreateDeviceId } from '../../utils/device';

const translations = {
  en: {
    trips: 'Trips',
    noTrips: 'You have no trip',
    create: 'Create new trip',
    edit: 'Edit',
    remove: 'Remove',
  },
  vn: {
    trips: 'Chuyến đi',
    noTrips: 'Bạn chưa có chuyến đi nào',
    create: 'Tạo chuyến đi mới',
    edit: 'Sửa',
    remove: 'Xóa',
  },
};

const PAGE_SIZE = 20;
const Home: React.FC = () => {
  const { trips, addTrip, deleteTrip, updateTrip, loading } = useTrips();
  const [lang, setLang] = useState('en');
  const [editTrip, setEditTrip] = useState<Trip | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);

  const totalPages = trips && trips.length ? Math.ceil(trips.length / PAGE_SIZE) : 1;
  const paginatedTrips = trips && trips.length ? trips.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : [];

  useEffect(() => {
    // Ensure device ID is set
    getOrCreateDeviceId();
    const handler = (e: CustomEvent) => setLang((e.detail && e.detail.lang) || 'en');
    window.addEventListener('app:language-changed', handler as EventListener);
    setLang(localStorage.getItem('lang') || 'en');
    return () => window.removeEventListener('app:language-changed', handler as EventListener);
  }, []);
  const t = translations[lang as 'en' | 'vn'] || translations.en;

  const handleAdd = (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    addTrip(data);
    setShowForm(false);
  };
  const handleEdit = (trip: Trip) => {
    setEditTrip(trip);
    setShowForm(true);
  };
  const handleUpdate = (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editTrip) {
      updateTrip(editTrip.id, data);
      setEditTrip(null);
      setShowForm(false);
    }
  };
  const handleCancel = () => {
    setEditTrip(null);
    setShowForm(false);
  };

  return (
    <main className="min-h-[60vh] bg-gray-50 py-8">
      <section className="max-w-3xl mx-auto bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4 text-center">{t.trips}</h2>
        {loading && <Loading />}
        {!loading && !trips.length && (
          <>
            <div className="text-center text-gray-500 mb-4">{t.noTrips}</div>
            {!showForm && (
              <div className="flex justify-center mb-6">
                <button
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                  onClick={() => setShowForm(true)}
                >
                  {t.create}
                </button>
              </div>
            )}
          </>
        )}
        {!loading && showForm && (
          <div className="mb-6">
            <TripForm
              onAdd={editTrip ? handleUpdate : handleAdd}
              initialData={editTrip || undefined}
              onCancel={handleCancel}
            />
          </div>
        )}
        {!loading && trips.length > 0 && (
          <>
            <TripList trips={paginatedTrips} onDelete={deleteTrip} onEdit={handleEdit} />
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Prev
              </button>
              <span className="mx-2">
                Page {page} of {totalPages}
              </span>
              <button
                className="px-2 py-1 rounded bg-gray-200 disabled:opacity-50"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default Home;
