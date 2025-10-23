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
    return <div>{t.noExpenses}</div>;
  }
  return (
    <ul className="divide-y divide-surface">
      {expenses.map((e: Expense) => (
        <li key={e.id} className="py-3">
          <div className="flex justify-between items-center text-sm">
            <div>
              <div className="text-lg font-semibold">{e.description}</div>
              <div>
                {t.paidBy}: {e.paidBy.name}
              </div>
              <div>
                {t.amount}: {e.amount}
              </div>
              <div>
                {t.date}: {new Date(e.date).toLocaleDateString()}
              </div>
              {/* split splittype */}
              <div>
                {t.splitType}: {e.splitType === 'equal' ? t.equal : t.custom}
              </div>
              {e.splits.length > 0 && (
                <div className="mt-2">
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
                className="px-2 py-1 rounded bg-success text-on-success hover-bg-success"
                onClick={() => onEdit(e.id)}
              >
                {t.edit}
              </button>
              <button
                className="px-2 py-1 rounded bg-danger text-on-danger hover-bg-danger"
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
