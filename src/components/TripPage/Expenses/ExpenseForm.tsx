import React, { useEffect, useState } from 'react';
import type { Expense, ExpenseSplit, Participant } from '../../../types/trip';

interface Props {
  participants: Participant[];
  tripId: string;
  onAdd: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> & { markAsContribution?: boolean }) => void;
  onEdit: (expenseId: string, updated: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  expenseToEdit?: Expense | null;
}

const translations = {
  en: {
    description: 'Description',
    amount: 'Amount',
    paidBy: 'Who paid?',
    selectParticipant: 'Select participant',
    attendees: 'Attendees',
    addExpense: 'Add Expense',
    expenseDescription: 'Expense description',
    splitType: 'Split type',
    equal: 'Equal',
    custom: 'Custom',
    customSplits: 'Custom splits',
    enterAmount: 'Enter amount',
    editExpense: 'Edit Expense',
    markAsContribution: 'Mark as contribution for payer',
  },
  vn: {
    description: 'Mô tả',
    amount: 'Số tiền',
    paidBy: 'Người thanh toán',
    selectParticipant: 'Chọn thành viên',
    attendees: 'Người tham gia',
    addExpense: 'Thêm khoản chi',
    expenseDescription: 'Mô tả khoản chi',
    splitType: 'Cách chia',
    equal: 'Chia đều',
    custom: 'Tùy chỉnh',
    customSplits: 'Chia theo tùy chỉnh',
    enterAmount: 'Nhập số tiền',
    editExpense: 'Sửa khoản chi',
    markAsContribution: 'Ghi nhận khoản này là đóng góp của người thanh toán',
  },
};

const ExpenseForm: React.FC<Props> = ({ participants, tripId, onAdd, onEdit, expenseToEdit }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [attendees, setAttendees] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<{
    description?: string;
    amount?: string;
    paidBy?: string;
    attendees?: string;
    customSplits?: string;
  }>({});
  const [markAsContribution, setMarkAsContribution] = useState(false);
  const lang = localStorage.getItem('lang') || 'en';
  const t = translations[lang as 'en' | 'vn'] || translations.en;

  useEffect(() => {
    if (!expenseToEdit) return;
    setDescription(expenseToEdit.description);
    setAmount(expenseToEdit.amount.toString());
    setPaidBy(expenseToEdit.paidBy.id);
    setAttendees(expenseToEdit.splits.map((s) => s.participant.id));
    setSplitType(expenseToEdit.splitType);
    if (expenseToEdit.splitType === 'custom') {
      const splitsRecord: Record<string, string> = {};
      expenseToEdit.splits.forEach((s) => {
        splitsRecord[s.participant.id] = s.amount.toString();
      });
      setCustomSplits(splitsRecord);
    }
  }, [expenseToEdit]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: typeof errors = {};
    if (!description) newErrors.description = t.description + ' is required';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0)
      newErrors.amount = t.amount + ' is required and must be positive';
    if (!paidBy) newErrors.paidBy = t.paidBy + ' is required';
    if (attendees.length === 0) newErrors.attendees = t.attendees + ' is required';
    if (splitType === 'custom') {
      const totalCustom = attendees.reduce((sum, id) => sum + Number(customSplits[id] || 0), 0);
      if (totalCustom !== Number(amount)) {
        newErrors.customSplits = t.customSplits + ' must sum to total amount';
      }
    }
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    const paidByObj = participants.find((p) => p.id === paidBy);
    if (!paidByObj) return;
    let splits: ExpenseSplit[] = [];
    if (splitType === 'equal') {
      const perPerson = Number(amount) / attendees.length;
      splits = attendees.map((id) => {
        const participant = participants.find((p) => p.id === id)!;
        return { participant, amount: perPerson };
      });
    } else {
      splits = attendees.map((id) => {
        const participant = participants.find((p) => p.id === id)!;
        return { participant, amount: Number(customSplits[id] || 0) };
      });
    }

    const data = {
      tripId,
      description,
      amount: Number(amount),
      paidBy: paidByObj,
      splits,
      splitType,
    };

    if (expenseToEdit) {
      onEdit(expenseToEdit.id, {
        ...data,
        date: expenseToEdit.date,
      });
    } else {
      onAdd({
        ...data,
        date: new Date().toISOString(),
        markAsContribution,
      });
    }
    setDescription('');
    setAmount('');
    setPaidBy('');
    setAttendees([]);
    setSplitType('equal');
    setCustomSplits({});
    setErrors({});
    setMarkAsContribution(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">{t.splitType}</label>
        <select
          className="w-full rounded border px-3 py-2"
          value={splitType}
          onChange={(e) => setSplitType(e.target.value as 'equal' | 'custom')}
        >
          <option value="equal">{t.equal}</option>
          <option value="custom">{t.custom}</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">{t.description}</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.expenseDescription}
        />
        {errors.description && <div className="text-red-500 text-xs mt-1">{errors.description}</div>}
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
        <label className="block text-sm font-medium mb-1">{t.paidBy}</label>
        <select className="w-full rounded border px-3 py-2" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
          <option value="">{t.selectParticipant}</option>
          {participants.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {errors.paidBy && <div className="text-red-500 text-xs mt-1">{errors.paidBy}</div>}
      </div>
      {!expenseToEdit && (
        <div>
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={markAsContribution}
              onChange={(e) => setMarkAsContribution(e.target.checked)}
            />
            {t.markAsContribution}
          </label>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-1">{t.attendees}</label>
        <div className="flex flex-wrap gap-2">
          {participants.map((p) => (
            <label key={p.id} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={attendees.includes(p.id)}
                onChange={(e) => {
                  setAttendees((prev) => (e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)));
                }}
              />
              {p.name}
            </label>
          ))}
        </div>
        {errors.attendees && <div className="text-red-500 text-xs mt-1">{errors.attendees}</div>}
      </div>
      {splitType === 'custom' && (
        <div>
          <label className="block text-sm font-medium mb-1">{t.customSplits}</label>
          <div className="flex flex-col gap-2">
            {attendees.map((id) => {
              const participant = participants.find((p) => p.id === id);
              if (!participant) return null;
              return (
                <div key={id} className="flex items-center gap-2">
                  <span>{participant.name}:</span>
                  <input
                    type="number"
                    className="w-32 rounded border px-2 py-1"
                    value={customSplits[id] || ''}
                    onChange={(e) => setCustomSplits((prev) => ({ ...prev, [id]: e.target.value }))}
                    placeholder={t.enterAmount}
                  />
                </div>
              );
            })}
          </div>
          {errors.customSplits && <div className="text-red-500 text-xs mt-1">{errors.customSplits}</div>}
        </div>
      )}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-5 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow"
        >
          {expenseToEdit ? t.editExpense : t.addExpense}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;
