import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../../components/Loading';
import ContributionSection from '../../components/TripPage/ContributionSection';
import ExpenseSection from '../../components/TripPage/ExpenseSection';
import TripInfoSection from '../../components/TripPage/TripInfoSection';
import useContributions from '../../hooks/useContributions';
import useExpenses from '../../hooks/useExpenses';
import useTrips from '../../hooks/useTrips';
import type { Contribution, Expense, Trip } from '../../types/trip';

const translations = {
  en: {
    notFound: 'Trip not found.',
    back: 'Back',
    participants: 'Participants:',
    totalMembers: 'Total members:',
    totalContributions: 'Total contributions:',
    totalExpenses: 'Total expenses:',
    addExpense: 'Add New Expense',
    addContribution: 'Add New Contribution',
    cancel: 'Cancel',
    contributions: 'Contributions',
    noContributions: 'No contributions yet.',
    amount: 'Amount',
    date: 'Date',
    expensesDetails: 'Expenses Details',
    noExpenses: 'No expenses yet.',
    paidBy: 'Paid by',
    splitType: 'Split type',
    equal: 'Equal',
    custom: 'Custom',
    splits: 'Splits:',
    edit: 'Edit',
    remove: 'Remove',
    expenses: 'Expenses',
    expensesDesc:
      'Expense UI will be migrated next. Existing app stores per-trip expenses in localStorage under key "expenses{id}".',
  },
  vn: {
    notFound: 'Không tìm thấy chuyến đi.',
    back: 'Quay lại',
    participants: 'Thành viên:',
    totalMembers: 'Tổng thành viên:',
    totalContributions: 'Tổng đóng góp:',
    totalExpenses: 'Tổng chi phí:',
    addExpense: 'Thêm chi phí',
    addContribution: 'Thêm đóng góp',
    cancel: 'Hủy',
    contributions: 'Đóng góp',
    noContributions: 'Chưa có đóng góp.',
    amount: 'Số tiền',
    date: 'Ngày',
    expensesDetails: 'Chi tiết chi phí',
    noExpenses: 'Chưa có chi phí.',
    paidBy: 'Người trả',
    splitType: 'Kiểu chia',
    equal: 'Chia đều',
    custom: 'Tùy chỉnh',
    splits: 'Chia cho:',
    edit: 'Sửa',
    remove: 'Xóa',
    expenses: 'Chi phí',
    expensesDesc:
      'Giao diện chi phí sẽ được cập nhật sau. Ứng dụng hiện lưu chi phí từng chuyến trong localStorage với key "expenses{id}".',
  },
};

const TripPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getById } = useTrips();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setTrip(null);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const t = getById(id);
      setTrip(t);
      setLoading(false);
    }, 400); // Simulate loading
  }, [id, getById]);
  const [lang, setLang] = useState('en');
  const { expenses, addExpense, editExpense, removeExpense } = useExpenses(id);
  const { contributions, addContribution } = useContributions(id);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [showContributionForm, setShowContributionForm] = useState(false);
  useEffect(() => {
    const handler = (e: CustomEvent) => setLang((e.detail && e.detail.lang) || 'en');
    window.addEventListener('app:language-changed', handler as EventListener);
    setLang(localStorage.getItem('lang') || 'en');
    return () => window.removeEventListener('app:language-changed', handler as EventListener);
  }, []);
  const t = translations[lang as 'en' | 'vn'] || translations.en;

  if (loading) {
    return <Loading />;
  }
  if (!id || !trip) {
    return (
      <main className="min-h-[60vh] bg-gray-50 py-8 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="mb-4 text-lg text-gray-700">{t.notFound}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {t.back}
          </button>
        </div>
      </main>
    );
  }

  // Calculate totals
  const totalContributions = contributions.reduce((sum, c) => sum + c.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  function handleAddContribution(contribution: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>) {
    addContribution(contribution);
    setShowContributionForm(false);
  }

  function handleAddExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    addExpense(expense);
    setShowExpenseForm(false);
    setEditExpenseId(null);
  }

  function handleEditExpenseEvent(expenseId: string) {
    setEditExpenseId(expenseId);
    setShowExpenseForm(true);
  }

  function handleEditExpense(expenseId: string, updated: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) {
    editExpense(expenseId, updated);
    setEditExpenseId(null);
  }

  function handleRemoveExpense(expenseId: string) {
    removeExpense(expenseId);
    setEditExpenseId(null);
  }

  return (
    <main className="min-h-[60vh] bg-gray-50 py-8">
      <section className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
        <TripInfoSection
          tripName={trip.name}
          startDate={trip.startDate}
          endDate={trip.endDate}
          participants={trip.participants}
          totalContributions={totalContributions}
          totalExpenses={totalExpenses}
          t={t}
          onAddExpense={() => setShowExpenseForm(true)}
          onAddContribution={() => setShowContributionForm(true)}
        />
        <ContributionSection
          showForm={showContributionForm}
          onShowForm={setShowContributionForm}
          onAdd={handleAddContribution}
          participants={trip.participants}
          contributions={contributions}
          t={t}
        />
        <ExpenseSection
          tripId={id}
          isFormVisible={showExpenseForm}
          setFormVisible={setShowExpenseForm}
          onAddExpense={handleAddExpense}
          onRemoveExpense={handleRemoveExpense}
          onEditExpense={handleEditExpense}
          onOpenExpenseForm={handleEditExpenseEvent}
          participants={trip.participants}
          expenses={expenses}
          t={t}
          expenseToEdit={expenses.find((e) => e.id === editExpenseId) || null}
        />
      </section>
    </main>
  );
};

export default TripPage;
