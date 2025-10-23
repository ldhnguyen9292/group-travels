import React from 'react';
import type { Contribution } from '../../../types/trip';

interface ContributionListProps {
  contributions: Contribution[];
  t: Record<string, string>;
  onEditContributionEvent?: (contributionId: string) => void;
  onRemoveContribution?: (contributionId: string) => void;
}

const ContributionList: React.FC<ContributionListProps> = ({
  contributions,
  t,
  onEditContributionEvent,
  onRemoveContribution,
}) => {
  if (contributions.length === 0) {
    return <div className="text-secondary">{t.noContributions}</div>;
  }
  return (
    <ul className="divide-y divide-surface">
      {contributions.map((c) => (
        <li key={c.id} className="py-2">
          <div className="flex justify-between items-center">
            <div className="grow">
              <div className="font-semibold">{c.participant.name}</div>
              <div className="text-sm text-muted">
                {t.amount}: {c.amount}
              </div>
              <div className="text-sm text-muted">
                {t.date}: {new Date(c.date).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-2">
              {onEditContributionEvent && (
                <button
                  className="px-2 py-1 rounded bg-success text-on-success hover:bg-success-dark"
                  onClick={() => onEditContributionEvent(c.id)}
                >
                  {t.edit}
                </button>
              )}
              {onRemoveContribution && (
                <button
                  className="px-2 py-1 rounded bg-danger text-on-danger hover:bg-danger-dark"
                  onClick={() => onRemoveContribution(c.id)}
                >
                  {t.remove}
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ContributionList;
