export interface MonthMeta {
  month: string; // 'YYYY-MM'
  label: string; // 'March 2026'
  year: number;
  monthNum: number; // 1 - 12
  isUnlocked: boolean;
  isCurrent: boolean;
  isFuture: boolean;
  isPast: boolean;
  unlockNotice?: string;
}

export function getMonthLabel(year: number, monthNum: number): string {
  const date = new Date(year, monthNum - 1, 1);
  return date.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function formatMonthKey(year: number, monthNum: number): string {
  return `${year}-${String(monthNum).padStart(2, '0')}`;
}

export function parseMonthKey(monthKey: string): { year: number; monthNum: number } {
  const [yearStr, monthStr] = monthKey.split('-');
  return {
    year: parseInt(yearStr, 10),
    monthNum: parseInt(monthStr, 10),
  };
}

/**
 * Calculates list of all available and upcoming months starting from current month (this month).
 * Month unlock rule:
 * - Current month is always unlocked.
 * - The next month automatically unlocks on or after day 30 of the current month (day >= 30), or via manual unlock.
 */
export function getAvailableMonths(now: Date = new Date(), manuallyUnlockedMonths: string[] = []): {
  months: MonthMeta[];
  currentMonthKey: string;
  defaultActiveMonth: string;
} {
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-12
  const currentDay = now.getDate(); // 1-31
  const currentMonthKey = formatMonthKey(currentYear, currentMonthNum);

  const months: MonthMeta[] = [];

  // Determine the ceiling month we should generate up to (current month + 1, plus any manual unlocks)
  // If next month is unlocked (day >= 30), we can also show current month + 2 as locked preview
  const isNextMonthUnlocked = currentDay >= 30;

  // We start iterating from the current month (this month)
  let iterYear = currentYear;
  let iterMonth = currentMonthNum;

  // Max preview month
  const targetMonthsAhead = isNextMonthUnlocked ? 2 : 1;
  let targetYear = currentYear;
  let targetMonth = currentMonthNum + targetMonthsAhead;
  while (targetMonth > 12) {
    targetYear += 1;
    targetMonth -= 12;
  }

  while (
    iterYear < targetYear ||
    (iterYear === targetYear && iterMonth <= targetMonth)
  ) {
    const monthKey = formatMonthKey(iterYear, iterMonth);
    const label = getMonthLabel(iterYear, iterMonth);

    const isPast =
      iterYear < currentYear ||
      (iterYear === currentYear && iterMonth < currentMonthNum);
    const isCurrent =
      iterYear === currentYear && iterMonth === currentMonthNum;
    
    // Check if this month is the immediate next month after current
    let isImmediateNext = false;
    let nextMonthOfCurrent = currentMonthNum + 1;
    let nextYearOfCurrent = currentYear;
    if (nextMonthOfCurrent > 12) {
      nextMonthOfCurrent = 1;
      nextYearOfCurrent += 1;
    }
    if (iterYear === nextYearOfCurrent && iterMonth === nextMonthOfCurrent) {
      isImmediateNext = true;
    }

    const isFuture = !isPast && !isCurrent;

    let isUnlocked = false;
    let unlockNotice: string | undefined;

    if (isPast || isCurrent) {
      isUnlocked = true;
    } else if (isImmediateNext) {
      if (isNextMonthUnlocked || manuallyUnlockedMonths.includes(monthKey)) {
        isUnlocked = true;
      } else {
        isUnlocked = false;
        const currentMonthName = new Date(currentYear, currentMonthNum - 1, 1).toLocaleString('en-US', { month: 'short' });
        unlockNotice = `Unlocks automatically on ${currentMonthName} 30`;
      }
    } else {
      // Further future months
      if (manuallyUnlockedMonths.includes(monthKey)) {
        isUnlocked = true;
      } else {
        isUnlocked = false;
        unlockNotice = `Locked`;
      }
    }

    months.push({
      month: monthKey,
      label,
      year: iterYear,
      monthNum: iterMonth,
      isUnlocked,
      isCurrent,
      isFuture,
      isPast,
      unlockNotice,
    });

    // Advance 1 month
    iterMonth += 1;
    if (iterMonth > 12) {
      iterMonth = 1;
      iterYear += 1;
    }
  }

  // Active month defaults to current month if in list and unlocked, or the latest unlocked month
  const unlocked = months.filter((m) => m.isUnlocked);
  const defaultActiveMonth =
    unlocked.find((m) => m.isCurrent)?.month ||
    (unlocked.length > 0 ? unlocked[unlocked.length - 1].month : currentMonthKey);

  return {
    months,
    currentMonthKey,
    defaultActiveMonth,
  };
}

export const DEFAULT_TEMPLATES = [
  {
    name: 'Shop / Office Rent',
    defaultAmount: '25000',
    dueDay: 5,
    category: 'RENT',
    notes: 'Monthly space rental',
    displayOrder: 1,
  },
  {
    name: 'Electricity Bill (EB)',
    defaultAmount: '4500',
    dueDay: 10,
    category: 'UTILITIES',
    notes: 'Commercial meter electricity charges',
    displayOrder: 2,
  },
  {
    name: 'High-Speed Wi-Fi & Internet',
    defaultAmount: '1200',
    dueDay: 7,
    category: 'UTILITIES',
    notes: 'Broadband internet plan',
    displayOrder: 3,
  },
  {
    name: 'Staff Salaries & Wages',
    defaultAmount: '35000',
    dueDay: 1,
    category: 'SALARY',
    notes: 'Staff payroll disbursement',
    displayOrder: 4,
  },
  {
    name: 'Shopify & Software Tools',
    defaultAmount: '3000',
    dueDay: 15,
    category: 'SOFTWARE',
    notes: 'Shopify plan, apps, and cloud tools',
    displayOrder: 5,
  },
  {
    name: 'Office Cleaning & Maintenance',
    defaultAmount: '2000',
    dueDay: 10,
    category: 'MAINTENANCE',
    notes: 'Waste disposal, water supply & housekeeping',
    displayOrder: 6,
  },
];
