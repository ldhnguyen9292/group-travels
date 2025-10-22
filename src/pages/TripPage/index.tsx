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
    expenseWarning: 'Warning: Expenses exceed contributions!',
  },
  vn: {
    notFound: 'Không tìm thấy chuyến đi.',
    back: 'Quay lại',
    participants: 'Thành viên:',
    totalMembers: 'Tổng số thành viên:',
    totalContributions: 'Tổng số đóng góp:',
    totalExpenses: 'Tổng chi tiêu:',
    addExpense: 'Thêm khoản chi mới',
    addContribution: 'Thêm khoản đóng góp',
    cancel: 'Hủy',
    contributions: 'Khoản đóng góp',
    noContributions: 'Chưa có ai đóng góp.',
    amount: 'Số tiền',
    date: 'Ngày',
    expensesDetails: 'Chi tiết chi tiêu',
    noExpenses: 'Chưa có khoản chi nào.',
    paidBy: 'Người thanh toán',
    splitType: 'Cách chia',
    equal: 'Chia đều',
    custom: 'Tùy chỉnh',
    splits: 'Chia cho:',
    edit: 'Chỉnh sửa',
    remove: 'Xóa',
    expenses: 'Khoản chi',
    expensesDesc:
      'Giao diện chi tiêu sẽ được cập nhật trong bản tiếp theo. Hiện tại, ứng dụng lưu chi tiêu của từng chuyến đi trong localStorage với khóa "expenses{id}".',
    expenseWarning: 'Cảnh báo: Chi tiêu vượt quá tổng đóng góp!',
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
  const { contributions, addContribution, editContribution, removeContribution } = useContributions(id);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [editContributionId, setEditContributionId] = useState<string | null>(null);

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

  // Contribution handlers
  function handleAddContribution(contribution: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>) {
    addContribution(contribution);
    setShowContributionForm(false);
  }

  function handleEditContributionEvent(contributionId: string) {
    setEditContributionId(contributionId);
    setShowContributionForm(true);
  }

  function handleEditContribution(
    contributionId: string,
    updated: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    editContribution(contributionId, updated);
    setEditContributionId(null);
    setShowContributionForm(false);
  }

  function handleRemoveContribution(contributionId: string) {
    removeContribution(contributionId);
    setEditContributionId(null);
  }

  // Expense handlers
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
    setShowExpenseForm(false);
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
          onEdit={handleEditContribution}
          onRemove={handleRemoveContribution}
          onEditContributionEvent={handleEditContributionEvent}
          participants={trip.participants}
          contributions={contributions}
          t={t}
          contributionToEdit={contributions.find((c) => c.id === editContributionId) || null}
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
