import { useState } from 'react';
import type { Expense } from '../../types/trip';

export default function useExpenses(tripId?: string) {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (!tripId) return [];
    try {
      return JSON.parse(localStorage.getItem(`expenses${tripId}`) || '[]');
    } catch {
      return [];
    }
  });

  function addExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    const newExpense: Expense = {
      ...expense,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tripId: tripId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newExpense, ...expenses];
    setExpenses(updated);
    localStorage.setItem(`expenses${tripId}`, JSON.stringify(updated));
  }

  function editExpense(
    expenseId: string,
    updatedFields: Partial<Omit<Expense, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>>
  ) {
    const updated = expenses.map((e) =>
      e.id === expenseId ? { ...e, ...updatedFields, updatedAt: new Date().toISOString() } : e
    );
    setExpenses(updated);
    localStorage.setItem(`expenses${tripId}`, JSON.stringify(updated));
  }

  function removeExpense(expenseId: string) {
    const updated = expenses.filter((e) => e.id !== expenseId);
    setExpenses(updated);
    localStorage.setItem(`expenses${tripId}`, JSON.stringify(updated));
  }

  return { expenses, addExpense, editExpense, removeExpense, setExpenses };
}
