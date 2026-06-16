'use client';

import { useState } from 'react';

interface DateRangePickerProps {
  onChange: (range: { startDate: string; endDate: string }) => void;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getPresets() {
  const now = new Date();

  // Tento měsíc
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Minulý měsíc
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  return [
    { label: 'Posledních 7 dní', start: '7daysAgo', end: 'today', key: '7d' },
    { label: 'Posledních 30 dní', start: '30daysAgo', end: 'today', key: '30d' },
    {
      label: 'Tento měsíc',
      start: formatDate(startOfMonth),
      end: 'today',
      key: 'thisMonth',
    },
    {
      label: 'Minulý měsíc',
      start: formatDate(startOfLastMonth),
      end: formatDate(endOfLastMonth),
      key: 'lastMonth',
    },
  ];
}

export default function DateRangePicker({ onChange }: DateRangePickerProps) {
  const presets = getPresets();
  const [selected, setSelected] = useState('30d');

  const handlePreset = (preset: (typeof presets)[0]) => {
    setSelected(preset.key);
    onChange({ startDate: preset.start, endDate: preset.end });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {presets.map((preset) => (
        <button
          key={preset.key}
          onClick={() => handlePreset(preset)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            selected === preset.key
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
