import React, { useState, useRef, useEffect } from 'react';
import { Clock, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomTimePickerProps {
  value: string; // HH:MM
  onChange: (value: string) => void;
  className?: string;
}

export const CustomTimePicker: React.FC<CustomTimePickerProps> = ({
  value,
  onChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Close dropdown on outside click
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

  // Format value to readable string
  const formatTimeLabel = (val: string) => {
    if (!val) return 'Select Time';
    const [hoursStr, minutesStr] = val.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    if (isNaN(hours) || isNaN(minutes)) return val;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMinutes = String(minutes).padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
  };

  // Generate 15-minute intervals for the list
  const timeOptions: { value: string; label: string }[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const hStr = String(hour).padStart(2, '0');
      const mStr = String(min).padStart(2, '0');
      const val = `${hStr}:${mStr}`;
      timeOptions.push({
        value: val,
        label: formatTimeLabel(val)
      });
    }
  }

  const filteredOptions = searchQuery
    ? timeOptions.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : timeOptions;

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-2.5 py-1 text-[11px] bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-850 rounded-lg hover:border-neutral-300 dark:hover:border-zinc-700 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500 text-neutral-900 dark:text-neutral-100 cursor-pointer whitespace-nowrap select-none shrink-0"
      >
        <span className="truncate mr-1.5">{formatTimeLabel(value)}</span>
        <Clock className="h-3 w-3 text-neutral-400 shrink-0" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 mt-1 left-0 w-48 bg-white dark:bg-zinc-950 border border-neutral-200 dark:border-zinc-850 rounded-xl shadow-lg focus:outline-none overflow-hidden"
          >
            {/* Search/Filter Input */}
            <div className="p-2 border-b border-neutral-100 dark:border-zinc-900">
              <input
                type="text"
                placeholder="Search time..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-2 py-1 text-[11px] bg-neutral-50 dark:bg-zinc-900 border border-neutral-200 dark:border-zinc-800 rounded-md focus:outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-100"
                autoFocus
              />
            </div>

            {/* Scrollable list */}
            <div className="max-h-56 overflow-y-auto py-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full px-3 py-1.5 text-[11px] text-left flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer ${
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-400 font-medium bg-indigo-50/50 dark:bg-indigo-950/10'
                          : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isSelected && <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-[11px] text-neutral-400 text-center">
                  No matches
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
