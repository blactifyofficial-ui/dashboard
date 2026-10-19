export interface Expense {
  id: string;
  expenseDate: string;
  createdAt: string;
  category: string;
  title: string;
  amount: string;
  paymentMethod: string;
}

export interface DateNote {
  id: string;
  date: string;
  note: string;
  updatedAt?: string;
}

export interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  isCurrent: boolean;
  totalAmount: number;
  totalRecords: number;
  dateKeys: string[];
  daysCount: number;
}
