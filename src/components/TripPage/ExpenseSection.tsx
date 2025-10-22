import React from 'react';
import type { Expense, Participant } from '../../types/trip';
import Modal from '../Modal';
import ExpenseForm from './Expenses/ExpenseForm';
import ExpensesList from './Expenses/ExpensesList';

interface ExpenseFormProps {
  tripId: string;
  isFormVisible: boolean;
  setFormVisible: (visible: boolean) => void;
  setEditExpenseId: (expenseId: string | null) => void;
  onAddExpense: (expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'> & { markAsContribution?: boolean }) => void;
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
  setEditExpenseId,
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
      <h3 className="text-2xl font-semibold mb-2 text-[#a5b4fc]">{t.expensesDetails}</h3>
      <Modal
        open={isFormVisible}
        onClose={() => {
          setFormVisible(false);
          setEditExpenseId(null);
        }}
      >
        <ExpenseForm
          participants={participants}
          tripId={tripId}
          onAdd={onAddExpense}
          onEdit={onEditExpense}
          expenseToEdit={expenseToEdit}
        />
      </Modal>
      {expenses.length === 0 ? (
        <div className="text-gray-500">{t.noExpenses}</div>
      ) : (
        <ExpensesList expenses={expenses} onRemove={onRemoveExpense} onEdit={onOpenExpenseForm} />
      )}
    </section>
  );
};

export default ExpenseSection;
