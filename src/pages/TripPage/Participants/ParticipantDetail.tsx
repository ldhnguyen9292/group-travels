import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from '../../../components/Loading';
import useContributions from '../../../hooks/useContributions';
import useExpenses from '../../../hooks/useExpenses';
import useTrips from '../../../hooks/useTrips';
import type { ExpenseSplit } from '../../../types/trip';

const translations = {
  en: {
    details: 'Participant Details',
    name: 'Name',
    notFound: 'Participant not found.',
    back: 'Back to list',
    totalContributed: 'Total Contributed',
    totalSpent: 'Total Spent',
    net: 'Net',
    contributions: 'Contributions',
    noContributions: 'No contributions.',
    expensesPaid: 'Expenses Paid',
    noExpenses: 'No expenses.',
  },
  vn: {
    details: 'Chi tiết thành viên',
    name: 'Tên',
    notFound: 'Không tìm thấy thành viên.',
    back: 'Quay lại danh sách',
    totalContributed: 'Tổng tiền ứng trước',
    totalSpent: 'Tổng chi tiêu',
    net: 'Còn lại',
    contributions: 'Tiền ứng trước',
    noContributions: 'Chưa có tiền ứng trước.',
    expensesPaid: 'Chi tiêu',
    noExpenses: 'Chưa có chi tiêu.',
  },
};

interface ParticipantExpense {
  id: string;
  description: string;
  amount: number;
}

const ParticipantDetail: React.FC = () => {
  const { id, participantId } = useParams<{ id: string; participantId: string }>();
  const { getById } = useTrips();
  const [loading, setLoading] = React.useState(true);
  const [lang, setLang] = React.useState('en');
  const { expenses } = useExpenses(id);
  const { contributions } = useContributions(id);
  const trip = id ? getById(id) : null;
  const participant = trip?.participants.find((p) => p.id === participantId);
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

  if (loading || !trip || !participant) {
    return <Loading />;
  }

  // Filter contributions and expenses for this participant
  const participantContributions = contributions.filter((c) => c.participant.id === participant.id);
  const participantExpenses: ParticipantExpense[] = [];
  expenses.map((e) => {
    const split: ExpenseSplit | undefined = e.splits.find((s) => s.participant.id === participant.id);
    if (split) {
      participantExpenses.push({
        id: e.id,
        description: e.description,
        amount: split.amount,
      });
    }
  });
  const totalContributed = participantContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalSpent = participantExpenses.reduce((sum, e) => sum + e.amount, 0);

  const net = totalContributed - totalSpent;
  let netColor = '';
  if (net > 0) netColor = 'text-green-600';
  else if (net < 0) netColor = 'text-red-600';

  return (
    <main className="max-w-xl mx-auto py-10">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8">
        <h2 className="text-3xl font-bold mb-6 text-center text-indigo-700 dark:text-indigo-300 drop-shadow">
          {t.details}
        </h2>
        <div className="mb-6 flex flex-col items-center">
          <div className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-1">{t.name}:</div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-300 mb-2">{participant.name}</div>
        </div>
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="bg-indigo-50 dark:bg-indigo-900 rounded-xl p-4 shadow">
            <div className="text-sm text-gray-500">{t.totalContributed}</div>
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-200">{totalContributed}</div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900 rounded-xl p-4 shadow">
            <div className="text-sm text-gray-500">{t.totalSpent}</div>
            <div className="text-xl font-bold text-indigo-700 dark:text-indigo-200">{totalSpent}</div>
          </div>
          <div
            className={`rounded-xl p-4 shadow ${net > 0 ? 'bg-green-50 dark:bg-green-900' : net < 0 ? 'bg-red-50 dark:bg-red-900' : 'bg-gray-50 dark:bg-gray-700'}`}
          >
            <div className="text-sm text-gray-500">{t.net}</div>
            <div className={`text-xl font-bold ${netColor}`}>{net}</div>
          </div>
        </div>
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full"></span> {t.contributions}
          </h3>
          {participantContributions.length === 0 ? (
            <div className="text-gray-400 italic text-center">{t.noContributions}</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {participantContributions.map((c) => (
                <li key={c.id} className="py-2 flex justify-between text-gray-700 dark:text-gray-200">
                  <span className="font-medium">{new Date(c.date).toLocaleDateString()}</span>
                  <span className="font-semibold">{c.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3 text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full"></span> {t.expensesPaid}
          </h3>
          {participantExpenses.length === 0 ? (
            <div className="text-gray-400 italic text-center">{t.noExpenses}</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {participantExpenses.map((e) => (
                <li key={e.id} className="py-2 flex justify-between text-gray-700 dark:text-gray-200">
                  <span className="font-medium">{e.description}</span>
                  <span className="font-semibold">{e.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="flex justify-center mt-6">
          <Link
            to={`/trip/${trip.id}/participants`}
            className="px-6 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow transition"
          >
            {t.back}
          </Link>
        </div>
      </div>
    </main>
  );
};

export default ParticipantDetail;
