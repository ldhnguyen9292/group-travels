import React, { useEffect, useState } from 'react';
import type { Contribution, Participant } from '../../../types/trip';

interface Props {
  participants: Participant[];
  onAdd: (contribution: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onEdit: (contributionId: string, updated: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>) => void;
  contributionToEdit: Contribution | null;
}

const translations = {
  en: {
    participant: 'Participant',
    amount: 'Amount',
    date: 'Date',
    addContribution: 'Add Contribution',
    selectParticipant: 'Select participant',
    editContribution: 'Edit Contribution',
  },
  vn: {
    participant: 'Thành viên',
    amount: 'Số tiền',
    date: 'Ngày',
    addContribution: 'Thêm khoản đóng góp',
    selectParticipant: 'Chọn thành viên',
    editContribution: 'Sửa khoản đóng góp',
  },
};

const ContributionForm: React.FC<Props> = ({ participants, onAdd, onEdit, contributionToEdit }) => {
  const [participantId, setParticipantId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [errors, setErrors] = useState<{ participantId?: string; amount?: string; date?: string }>({});
  const lang = localStorage.getItem('lang') || 'en';
  const t = translations[lang as 'en' | 'vn'] || translations.en;

  useEffect(() => {
    if (contributionToEdit) {
      setParticipantId(contributionToEdit.participant.id);
      setAmount(contributionToEdit.amount.toString());
      setDate(contributionToEdit.date);
    }
  }, [contributionToEdit]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: { participantId?: string; amount?: string; date?: string } = {};
    if (!participantId) newErrors.participantId = t.selectParticipant;
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = t.amount + ' is required and must be positive';
    if (!date) newErrors.date = t.date + ' is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return;
    if (contributionToEdit) {
      onEdit(contributionToEdit.id, {
        tripId: '', // to be set by parent
        participant,
        amount: Number(amount),
        date,
      });
    } else {
      onAdd({
        tripId: '', // to be set by parent
        participant,
        amount: Number(amount),
        date,
      });
    }
    setParticipantId('');
    setAmount('');
    setDate('');
    setErrors({});
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t.participant}</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={participantId}
          onChange={(e) => setParticipantId(e.target.value)}
        >
          <option value="">{t.selectParticipant}</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {errors.participantId && <div className="text-red-500 text-xs mt-1">{errors.participantId}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t.amount}</label>
        <input
          type="number"
          className="w-full rounded border px-3 py-2"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={t.amount}
        />
        {errors.amount && <div className="text-red-500 text-xs mt-1">{errors.amount}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t.date}</label>
        <input
          type="date"
          className="w-full rounded border px-3 py-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        {errors.date && <div className="text-red-500 text-xs mt-1">{errors.date}</div>}
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-semibold shadow"
        >
          {contributionToEdit ? t.editContribution : t.addContribution}
        </button>
      </div>
    </form>
  );
};

export default ContributionForm;
