"use client";

interface DatePickerProps {
  value: string; // ISO date string
  onChange: (date: string) => void;
  label?: string;
  className?: string;
}

export default function DatePicker({
  value,
  onChange,
  label,
  className = "",
}: DatePickerProps) {
  // Format date for display
  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Check if date is today
  const isToday = (isoDate: string) => {
    const date = new Date(isoDate);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Quick date options
  const setToday = () => {
    onChange(new Date().toISOString().split("T")[0]);
  };

  const setYesterday = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    onChange(yesterday.toISOString().split("T")[0]);
  };

  const inputId = `date-picker-${label?.toLowerCase().replace(/\s+/g, "-") || "date"}`;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={inputId}
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            max={new Date().toISOString().split("T")[0]}
            aria-label={label || "Select date"}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="button"
          onClick={setToday}
          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
            isToday(value)
              ? "bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
              : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          Today
        </button>
        <button
          type="button"
          onClick={setYesterday}
          className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Yesterday
        </button>
      </div>
      {value && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formatDisplayDate(value)}
        </p>
      )}
    </div>
  );
}
