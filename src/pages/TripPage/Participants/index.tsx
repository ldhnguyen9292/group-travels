import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../../../components/Loading';
import useContributions from '../../../hooks/useContributions';
import useExpenses from '../../../hooks/useExpenses';
import useTrips from '../../../hooks/useTrips';

const translations = {
  en: {
    participants: 'Participants',
    details: 'Details',
    notFound: 'Trip not found.',
    totalMembers: 'Total members:',
    totalContributions: 'Total contributions',
    totalExpenses: 'Total expenses',
  },
  vn: {
    participants: 'Thành viên',
    details: 'Chi tiết',
    notFound: 'Không tìm thấy chuyến đi.',
    totalMembers: 'Tổng số thành viên:',
    totalContributions: 'Tổng tiền quỹ nhóm:',
    totalExpenses: 'Tổng chi tiêu:',
  },
};

const ParticipantsPage: React.FC = () => {
  const { id } = useParams();
  const { getById } = useTrips();
  const [loading, setLoading] = React.useState(true);
  const [lang, setLang] = React.useState('en');
  const { expenses } = useExpenses(id as string);
  const { contributions } = useContributions(id as string);
  const navigate = useNavigate();
  const trip = id ? getById(id as string) : null;
  React.useEffect(() => {
    setLoading(false);
  }, [id, expenses, contributions]);
  React.useEffect(() => {
    const handler = (e: CustomEvent) => setLang((e.detail && e.detail.lang) || 'en');
    window.addEventListener('app:language-changed', handler as EventListener);
    setLang(localStorage.getItem('lang') || 'en');
    return () => window.removeEventListener('app:language-changed', handler as EventListener);
  }, []);
  const t = translations[lang as 'en' | 'vn'] || translations.en;

  if (loading || !trip) {
    return <Loading />;
  }

  const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <main className="max-w-2xl mx-auto py-10">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700 dark:text-indigo-300 drop-shadow">
          {trip.name}
        </h2>
        <div className="mb-6 flex flex-col items-center">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">
            {trip.startDate} {trip.endDate ? `— ${trip.endDate}` : ''}
          </div>
        </div>
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-indigo-50 dark:bg-indigo-900 rounded-xl p-4 shadow">
            <div className="text-sm text-gray-500">{t.totalContributions}</div>
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-200">{totalContributions}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900 rounded-xl p-4 shadow">
            <div className="text-sm text-gray-500">{t.totalExpenses}</div>
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-200">{totalExpenses}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900 rounded-xl p-4 shadow">
            <div className="text-sm text-gray-500">{t.totalMembers}</div>
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-200">{trip.participants.length}</div>
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-4 text-center text-indigo-700 dark:text-indigo-300">
          {t.participants}
        </h2>
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 mb-6">
          {trip.participants.map((p) => (
            <li key={p.id} className="py-3 flex justify-between items-center text-gray-700 dark:text-gray-200">
              <span className="font-medium text-lg">{p.name}</span>
              <button
                onClick={() => navigate(`/trip/${trip.id}/participants/${p.id}`)}
                className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 hover:bg-indigo-200 text-sm font-semibold shadow transition"
              >
                {t.details}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
};

export default ParticipantsPage;
