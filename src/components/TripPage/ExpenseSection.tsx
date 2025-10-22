import React from 'react';
import type { Expense, Participant } from '../../types/trip';
import ExpenseForm from './Expenses/ExpenseForm';

interface ExpenseFormProps {
  tripId: string;
  isFormVisible: boolean;
  setFormVisible: (visible: boolean) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onRemoveExpense: (expenseId: string) => void;
  onOpenExpenseForm: (expenseId: string) => void; // open form to edit an existing expense
  onEditExpense: (expenseId: string, updated: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => void;
  participants: Participant[];
  expenses: Expense[];
  t: Record<string, string>;
  expenseToEdit?: Expense | null;
}

const ExpenseSection: React.FC<ExpenseFormProps> = ({
  tripId,
  isFormVisible,
  setFormVisible,
  onAddExpense,
  onRemoveExpense,
  onOpenExpenseForm,
  onEditExpense,
  participants,
  expenses,
  expenseToEdit,
  t,
}) => {
  return (
    <section className="mt-6">
      <h3 className="text-lg font-semibold mb-2">{t.expensesDetails}</h3>
      {isFormVisible && (
        <div className="mb-6">
          <ExpenseForm
            participants={participants}
            tripId={tripId}
            onAdd={onAddExpense}
            onEdit={onEditExpense}
            expenseToEdit={expenseToEdit}
          />
          <button className="mt-2 px-3 py-1 rounded bg-gray-200 text-gray-700" onClick={() => setFormVisible(false)}>
            {t.cancel}
          </button>
        </div>
      )}
      {expenses.length === 0 ? (
        <div className="text-gray-500">{t.noExpenses}</div>
      ) : (
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
                  <div className="text-sm text-gray-600">
                    {t.splitType}: {e.splitType === 'equal' ? t.equal : t.custom}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    <strong>{t.splits}</strong>
                    <ul className="ml-4 list-disc">
                      {e.splits.map((split, idx) => (
                        <li key={split.participant.id + idx}>
                          {split.participant.name}: {split.amount}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-2 py-1 rounded bg-yellow-100 text-yellow-800"
                    onClick={() => onOpenExpenseForm(e.id)}
                  >
                    {t.edit}
                  </button>
                  <button className="px-2 py-1 rounded bg-red-100 text-red-800" onClick={() => onRemoveExpense(e.id)}>
                    {t.remove}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default ExpenseSection;
