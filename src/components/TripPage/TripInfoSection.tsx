import React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Participant } from '../../types/trip';

interface Props {
  tripId: string;
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
  tripId,
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
      <div className="flex justify-center text-sm mb-4 gap-2">
        <button onClick={() => navigate('/')} className="px-4 py-2 rounded bg-info text-on-primary hover:bg-info-hover">
          {t.back}
        </button>
        <button
          onClick={() => navigate(`/trip/${tripId}/participants`)}
          className="px-4 py-2 rounded bg-info text-on-primary hover:bg-info-hover"
        >
          {t.ParticipantDetail}
        </button>
      </div>
      <h2 className="mb-4 text-center">{tripName}</h2>
      <div className="mb-4 text-center">
        {startDate} {endDate ? `— ${endDate}` : ''}
      </div>

      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
        <div className="bg-input-background rounded-xl p-4 shadow">
          <div className="text-sm text-secondary">{t.totalMembers}</div>
          <div className="text-xl font-bold text-primary">{participants.length}</div>
        </div>
        <div className="bg-input-background rounded-xl p-4 shadow">
          <div className="text-sm text-secondary">{t.totalContributions}</div>
          <div className="text-xl font-bold text-primary">{totalContributions}</div>
        </div>
        <div className="bg-input-background rounded-xl p-4 shadow">
          <div className="text-sm text-secondary">{t.totalExpenses}</div>
          <div className="text-xl font-bold text-primary">{totalExpenses}</div>
        </div>
      </div>

      <div className="mb-4 text-center">
        <strong>{t.participants}</strong> {participants.map((p) => p.name).join(', ')}
      </div>

      {totalExpenses > totalContributions && (
        <div className="mb-2 text-center text-danger font-semibold">
          {t.expenseWarning || 'Warning: Expenses exceed contributions!'}
        </div>
      )}
      <div className="flex justify-center mb-4 gap-4">
        <button className="px-4 py-2 rounded bg-primary text-on-primary hover-bg-primary" onClick={onAddExpense}>
          {t.addExpense}
        </button>
        <button className="px-4 py-2 rounded bg-primary text-on-primary hover-bg-primary" onClick={onAddContribution}>
          {t.addContribution}
        </button>
      </div>
    </>
  );
};

export default TripInfoSection;
