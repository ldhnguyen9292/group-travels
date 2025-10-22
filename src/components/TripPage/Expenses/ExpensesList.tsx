import React from 'react';
import useExpenses from '../../../hooks/useExpenses';
import type { Expense } from '../../../types/trip';

interface Props {
  expenses: Expense[];
  onRemove: ReturnType<typeof useExpenses>['removeExpense'];
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
    splitType: 'Split type',
    equal: 'Equal',
    custom: 'Custom',
    splits: 'Splits:',
  },
  vn: {
    noExpenses: 'Chưa có chi phí nào.',
    paidBy: 'Người trả',
    amount: 'Số tiền',
    date: 'Ngày',
    edit: 'Sửa',
    remove: 'Xóa',
    splitType: 'Kiểu chia',
    equal: 'Chia đều',
    custom: 'Tùy chỉnh',
    splits: 'Chia cho:',
  },
};

const ExpensesList: React.FC<Props> = ({ expenses, onEdit, onRemove }) => {
  const lang = localStorage.getItem('lang') || 'en';
  const t = translations[lang as 'en' | 'vn'] || translations.en;
  if (expenses.length === 0) {
    return <div className="text-gray-500">{t.noExpenses}</div>;
  }
  return (
    <ul className="divide-y divide-gray-200">
      {expenses.map((e: Expense) => (
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
              {/* split splittype */}
              <div className="text-sm text-gray-600">
                {t.splitType}: {e.splitType === 'equal' ? t.equal : t.custom}
              </div>
              {e.splits.length > 0 && (
                <div className="text-sm text-gray-600">
                  {t.splits}
                  <ul className="list-disc list-inside">
                    {e.splits.map((s) => (
                      <li key={s.participant.id}>
                        {s.participant.name}: {s.amount}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                className="px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700"
                onClick={() => onEdit(e.id)}
              >
                {t.edit}
              </button>
              <button
                className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={() => onRemove(e.id)}
              >
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
