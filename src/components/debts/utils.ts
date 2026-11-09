export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0.00';
  }
  const num = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

export function formatDisplayDate(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatInputDate(dateInput?: string | Date | null): string {
  const d = dateInput ? new Date(dateInput) : new Date();
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getDaysRemainingBadge(dueDateStr: string | null | undefined): {
  text: string;
  isOverdue: boolean;
  isDueSoon: boolean;
  className: string;
} | null {
  if (!dueDateStr) return null;
  const dueDate = new Date(dueDateStr);
  if (isNaN(dueDate.getTime())) return null;

  const now = new Date();
  // Strip time for clean day comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      text: `${daysAgo}d overdue`,
      isOverdue: true,
      isDueSoon: false,
      className: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    };
  }

  if (diffDays === 0) {
    return {
      text: 'Due today',
      isOverdue: false,
      isDueSoon: true,
      className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    };
  }

  if (diffDays <= 7) {
    return {
      text: `Due in ${diffDays}d`,
      isOverdue: false,
      isDueSoon: true,
      className: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    };
  }

  return {
    text: `Due in ${diffDays}d`,
    isOverdue: false,
    isDueSoon: false,
    className: 'bg-neutral-800 text-neutral-300 border-neutral-700',
  };
}

