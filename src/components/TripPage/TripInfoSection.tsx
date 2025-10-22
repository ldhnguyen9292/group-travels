import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Participant } from '../../types/trip';

interface Props {
  tripName: string;
  startDate?: string;
  endDate?: string;
  participants: Participant[];
  totalContributions: number;
  totalExpenses: number;
  t: Record<string, string>;
  onAddExpense: () => void;
  onAddContribution: () => void;
}

const TripInfoSection: React.FC<Props> = ({
  tripName,
  startDate,
  endDate,
  participants,
  totalContributions,
  totalExpenses,
  t,
  onAddExpense,
  onAddContribution,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <div className="flex justify-center text-sm text-gray-500 mb-4">
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {t.back}
        </button>
      </div>
      <h2 className="text-2xl font-semibold mb-2 text-center">{tripName}</h2>
      <div className="text-gray-600 mb-2 text-center">
        {startDate} {endDate ? `— ${endDate}` : ''}
      </div>
      <div className="mb-2 text-center">
        <strong>{t.participants}</strong> {participants.map((p) => p.name).join(', ')}
      </div>
      <div className="mb-2 text-center">
        <strong>{t.totalMembers}</strong> {participants.length}
      </div>
      <div className="mb-2 text-center">
        <strong>{t.totalContributions}</strong> {totalContributions}
      </div>
      <div className="mb-2 text-center">
        <strong>{t.totalExpenses}</strong> {totalExpenses}
      </div>
      {totalExpenses > totalContributions && (
        <div className="mb-2 text-center text-red-600 font-semibold">
          {t.expenseWarning || 'Warning: Expenses exceed contributions!'}
        </div>
      )}
      <div className="flex justify-center mb-4 gap-4">
        <button className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={onAddExpense}>
          {t.addExpense}
        </button>
        <button className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700" onClick={onAddContribution}>
          {t.addContribution}
        </button>
      </div>
    </>
  );
};

export default TripInfoSection;
