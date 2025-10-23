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
      <div className="bg-surface rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center drop-shadow">{trip.name}</h2>
        <div className="mb-6 flex flex-col items-center">
          <div className="text-lg font-semibold text-primary mb-1">
            {trip.startDate} {trip.endDate ? `— ${trip.endDate}` : ''}
          </div>
        </div>
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-input-background rounded-xl p-4 shadow">
            <div className="text-sm text-secondary">{t.totalContributions}</div>
            <div className="text-xl font-bold text-primary">{totalContributions}</div>
          </div>
          <div className="bg-input-background rounded-xl p-4 shadow">
            <div className="text-sm text-secondary">{t.totalExpenses}</div>
            <div className="text-xl font-bold text-primary">{totalExpenses}</div>
          </div>
          <div className="bg-input-background rounded-xl p-4 shadow">
            <div className="text-sm text-secondary">{t.totalMembers}</div>
            <div className="text-xl font-bold text-primary">{trip.participants.length}</div>
          </div>
        </div>
        <h2 className="text-2xl font-semibold mb-4 text-center">{t.participants}</h2>
        <ul className="divide-y divide-input-background mb-6">
          {trip.participants.map((p) => (
            <li key={p.id} className="py-3 flex justify-between items-center text-primary">
              <span className="font-medium text-lg">{p.name}</span>
              <button
                onClick={() => navigate(`/trip/${trip.id}/participants/${p.id}`)}
                className="px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-dark text-sm font-semibold shadow transition"
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
