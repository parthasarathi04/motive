import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse the current value, default to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : new Date();
  
  // Track currently viewed month/year in the calendar view
  const [viewDate, setViewDate] = useState(() => {
    return value ? new Date(value + 'T00:00:00') : new Date();
  });

  // Sync viewDate when value changes externally
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  // Close calendar on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed

  // Months labels
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Weekdays labels
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days in month calculation
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  // First weekday of the month
  const getFirstWeekday = (y: number, m: number) => {
    return new Date(y, m, 1).getDay();
  };

  const totalDays = getDaysInMonth(year, month);
  const firstDayIndex = getFirstWeekday(year, month);

  // Generate grid array
  const calendarCells: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month's trailing days
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    const mStr = String(prevMonth + 1).padStart(2, '0');
    const dStr = String(dayNum).padStart(2, '0');
    calendarCells.push({
      dateStr: `${prevYear}-${mStr}-${dStr}`,
      dayNum,
      isCurrentMonth: false
    });
  }

  // Current month's days
  for (let i = 1; i <= totalDays; i++) {
    const mStr = String(month + 1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    calendarCells.push({
      dateStr: `${year}-${mStr}-${dStr}`,
      dayNum: i,
      isCurrentMonth: true
    });
  }

  // Next month's leading days to complete the 6-row grid (42 cells)
  const remainingCells = 42 - calendarCells.length;
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  for (let i = 1; i <= remainingCells; i++) {
    const mStr = String(nextMonth + 1).padStart(2, '0');
    const dStr = String(i).padStart(2, '0');
    calendarCells.push({
      dateStr: `${nextYear}-${mStr}-${dStr}`,
      dayNum: i,
      isCurrentMonth: false
    });
  }

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const formatDateLabel = (val: string) => {
    if (!val) return 'Select Date';
    try {
      const d = new Date(val + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return val;
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-2.5 py-1 text-[11px] bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-850 rounded-lg hover:border-neutral-300 dark:hover:border-zinc-700 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-neutral-100 cursor-pointer whitespace-nowrap select-none shrink-0"
      >
        <span className="truncate mr-1.5">{formatDateLabel(value)}</span>
        <CalendarIcon className="h-3 w-3 text-neutral-400 shrink-0" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1 left-0 w-64 p-3 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-850 rounded-xl shadow-lg focus:outline-none"
          >
            {/* Header controls */}
            <div className="flex items-center justify-between mb-2">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-zinc-900 text-neutral-600 dark:text-neutral-400 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                {months[month]} {year}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-zinc-900 text-neutral-600 dark:text-neutral-400 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {weekdays.map((day) => (
                <span key={day} className="text-[10px] font-medium text-neutral-400 dark:text-neutral-500 font-mono">
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarCells.map((cell, idx) => {
                const isSelected = cell.dateStr === value;
                const isToday = cell.dateStr === todayStr;

                return (
                  <button
                    key={`${cell.dateStr}-${idx}`}
                    type="button"
                    onClick={() => handleSelectDate(cell.dateStr)}
                    className={`h-7 w-7 text-[11px] rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white font-semibold'
                        : isToday
                        ? 'bg-neutral-100 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-500/20'
                        : cell.isCurrentMonth
                        ? 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-zinc-900'
                        : 'text-neutral-400 dark:text-neutral-600 hover:bg-neutral-50 dark:hover:bg-zinc-950/40'
                    }`}
                  >
                    {cell.dayNum}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
