import React, { useState } from 'react';
import type { Contribution, Participant } from '../../../types/trip';

interface Props {
  participants: Participant[];
  onAdd: (contribution: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

const translations = {
  en: {
    participant: 'Participant',
    amount: 'Amount',
    date: 'Date',
    addContribution: 'Add Contribution',
    selectParticipant: 'Select participant',
  },
  vn: {
    participant: 'Thành viên',
    amount: 'Số tiền',
    date: 'Ngày',
    addContribution: 'Thêm đóng góp',
    selectParticipant: 'Chọn thành viên',
  },
};

const ContributionForm: React.FC<Props> = ({ participants, onAdd }) => {
  const [participantId, setParticipantId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const lang = localStorage.getItem('lang') || 'en';
  const t = translations[lang as 'en' | 'vn'] || translations.en;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!participantId || !amount || !date) return;
    const participant = participants.find((p) => p.id === participantId);
    if (!participant) return;
    onAdd({
      tripId: '', // to be set by parent
      participant,
      amount: Number(amount),
      date,
    });
    setParticipantId('');
    setAmount('');
    setDate('');
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
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">{t.date}</label>
        <input
          type="date"
          className="w-full rounded border px-3 py-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-5 py-2 rounded bg-green-600 text-white hover:bg-green-700 font-semibold shadow"
        >
          {t.addContribution}
        </button>
      </div>
    </form>
  );
};

export default ContributionForm;
