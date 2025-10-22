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
    noTrips: 'You have no trips yet',
    create: 'Create new trip',
    edit: 'Edit',
    remove: 'Remove',
    prev: 'Prev',
    next: 'Next',
    page: 'Page',
    of: 'of',
  },
  vn: {
    trips: 'Chuyến đi',
    noTrips: 'Chưa có chuyến đi nào.',
    create: 'Tạo chuyến đi mới',
    edit: 'Sửa',
    remove: 'Xóa',
    prev: 'Trước',
    next: 'Sau',
    page: 'Trang',
    of: 'trên',
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
    <main className="min-h-[60vh] py-8">
      <section className="max-w-3xl mx-auto bg-[#1e293b] rounded-2xl shadow-lg p-8 border border-[#334155] text-gray-100 p-6">
        <h2 className="text-3xl font-semibold mb-4 text-center text-[#a5b4fc]">{t.trips}</h2>
        {loading && <Loading />}
        {!loading && (
          <>
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
        {!loading && trips.length === 0 && !showForm && <p>{t.noTrips}</p>}
        {!loading && trips.length > 0 && (
          <>
            <TripList trips={paginatedTrips} onDelete={deleteTrip} onEdit={handleEdit} />
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 font-semibold mb-2 text-white"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t.prev}
              </button>
              <span className="mx-2 font-semibold mb-2 text-[#c7d2fe]">
                {t.page} {page} {t.of} {totalPages}
              </span>
              <button
                className="px-2 py-1 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 font-semibold mb-2 text-white"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                {t.next}
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default Home;
