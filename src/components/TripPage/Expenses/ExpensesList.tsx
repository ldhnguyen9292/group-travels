import React, { useState } from 'react';
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

const ITEMS_PER_PAGE = 5;
const ExpensesList: React.FC<Props> = ({ expenses, onEdit, onRemove }) => {
  const lang = localStorage.getItem('lang') || 'en';
  const t = translations[lang as 'en' | 'vn'] || translations.en;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(expenses.length / ITEMS_PER_PAGE);
  const paginated = expenses.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  if (expenses.length === 0) {
    return <div>{t.noExpenses}</div>;
  }
  return (
    <>
      <ul className="divide-y divide-surface">
        {paginated.map((e: Expense) => (
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
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            className="px-2 py-1 rounded border"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            {'<'}
          </button>
          <span className="px-2 py-1">
            {page} / {totalPages}
          </span>
          <button
            className="px-2 py-1 rounded border"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            {'>'}
          </button>
        </div>
      )}
    </>
  );
};

export default ExpensesList;
