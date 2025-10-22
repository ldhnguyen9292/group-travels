import React from 'react';
import type { Contribution, Participant } from '../../types/trip';
import Modal from '../Modal';
import ContributionForm from './Contributions/ContributionForm';
import ContributionList from './Contributions/ContributionList';

interface Props {
  showForm: boolean;
  setEditContributionId: (contributionId: string | null) => void;
  onShowForm: (show: boolean) => void;
  onAdd: (contribution: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onEdit: (contributionId: string, updated: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onRemove: (contributionId: string) => void;
  onEditContributionEvent: (contributionId: string) => void;
  participants: Participant[];
  contributions: Contribution[];
  t: Record<string, string>;
  contributionToEdit: Contribution | null;
}

const ContributionSection: React.FC<Props> = ({
  showForm,
  setEditContributionId,
  onShowForm,
  onAdd,
  onEdit,
  onRemove,
  onEditContributionEvent,
  participants,
  contributions,
  t,
  contributionToEdit,
}) => (
  <section className="mt-6">
    <h3 className="text-lg font-semibold mb-2">{t.contributions}</h3>
    <Modal
      open={showForm}
      onClose={() => {
        onShowForm(false);
        setEditContributionId(null);
      }}
    >
      <ContributionForm
        participants={participants}
        onAdd={onAdd}
        onEdit={onEdit}
        contributionToEdit={contributionToEdit}
      />
    </Modal>
    <ContributionList
      contributions={contributions}
      t={t}
      onEditContributionEvent={onEditContributionEvent}
      onRemoveContribution={onRemove}
    />
  </section>
);

export default ContributionSection;
