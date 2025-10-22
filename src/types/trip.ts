export type ID = string;

export interface Participant {
  id: ID;
  name: string;
}

export interface Trip {
  id: ID;
  userDevice: string;
  name: string;
  startDate?: string;
  endDate?: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: ID;
  tripId: ID;
  description: string;
  amount: number; // tổng tiền
  paidBy: Participant; // người chi trả
  splits: ExpenseSplit[]; // chi tiết chia cho từng người
  splitType: 'equal' | 'custom'; // chia đều hay chia riêng
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSplit {
  participant: Participant;
  amount: number;
}

export interface Settlement {
  id: ID;
  tripId: ID;
  from: Participant;
  to: Participant;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TripDetails extends Trip {
  expenses: Expense[];
  settlements: Settlement[];
  contributions: Contribution[];
}

export interface TripFinanceSummary {
  totalContributions: number;
  totalExpenses: number;
  remainingBalance: number;
}

export interface ExpenseSummary extends Expense {
  paidByName: string;
}

export interface Contribution {
  id: ID;
  tripId: ID;
  participant: Participant;
  amount: number;
  date: string; // Ngày thu tiền
  createdAt: string;
  updatedAt: string;
}
