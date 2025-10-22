import React from 'react';
import type { Contribution, Participant } from '../../types/trip';
import ContributionForm from './Contributions/ContributionForm';

interface Props {
  showForm: boolean;
  onShowForm: (show: boolean) => void;
  onAdd: (contribution: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>) => void;
  participants: Participant[];
  contributions: Contribution[];
  t: Record<string, string>;
}

const ContributionSection: React.FC<Props> = ({ showForm, onShowForm, onAdd, participants, contributions, t }) => (
  <section className="mt-6">
    <h3 className="text-lg font-semibold mb-2">{t.contributions}</h3>
    {showForm && (
      <div className="mb-6">
        <ContributionForm participants={participants} onAdd={onAdd} />
        <button className="mt-2 px-3 py-1 rounded bg-gray-200 text-gray-700" onClick={() => onShowForm(false)}>
          {t.cancel}
        </button>
      </div>
    )}
    {contributions.length === 0 ? (
      <div className="text-gray-500">{t.noContributions}</div>
    ) : (
      <ul className="divide-y divide-gray-200">
        {contributions.map((c) => (
          <li key={c.id} className="py-2">
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold">{c.participant.name}</div>
                <div className="text-sm text-gray-600">
                  {t.amount}: {c.amount}
                </div>
                <div className="text-sm text-gray-600">
                  {t.date}: {new Date(c.date).toLocaleDateString()}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    )}
  </section>
);

export default ContributionSection;
