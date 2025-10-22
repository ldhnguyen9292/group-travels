import React from 'react';
import useExpenses from '../../../hooks/useExpenses';

interface Props {
  tripId: string;
  onEdit: (id: string) => void;
}

const translations = {
  en: {
    noExpenses: 'No expenses yet.',
    paidBy: 'Paid by',
    amount: 'Amount',
    date: 'Date',
    edit: 'Edit',
    remove: 'Remove',
  },
  vn: {
    noExpenses: 'Chưa có chi phí nào.',
    paidBy: 'Người trả',
    amount: 'Số tiền',
    date: 'Ngày',
    edit: 'Sửa',
    remove: 'Xóa',
  },
};

const ExpensesList: React.FC<Props> = ({ tripId, onEdit }) => {
  const { expenses, removeExpense } = useExpenses(tripId);
  const lang = localStorage.getItem('lang') || 'en';
  const t = translations[lang as 'en' | 'vn'] || translations.en;
  if (expenses.length === 0) {
    return <div className="text-gray-500">{t.noExpenses}</div>;
  }
  return (
    <ul className="divide-y divide-gray-200">
      {expenses.map((e) => (
        <li key={e.id} className="py-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-semibold">{e.description}</div>
              <div className="text-sm text-gray-600">
                {t.paidBy}: {e.paidBy.name}
              </div>
              <div className="text-sm text-gray-600">
                {t.amount}: {e.amount}
              </div>
              <div className="text-sm text-gray-600">
                {t.date}: {new Date(e.date).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-2 py-1 rounded bg-yellow-100 text-yellow-800" onClick={() => onEdit(e.id)}>
                {t.edit}
              </button>
              <button className="px-2 py-1 rounded bg-red-100 text-red-800" onClick={() => removeExpense(e.id)}>
                {t.remove}
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
};

export default ExpensesList;
