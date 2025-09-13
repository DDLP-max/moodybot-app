import { ValidationMode } from '@/lib/types/validation';

type Props = {
  value: ValidationMode;
  onChange: (v: ValidationMode) => void;
};

const modes: { key: ValidationMode; label: string; icon?: React.ReactNode }[] = [
  { key: 'positive', label: 'Positive' },
  { key: 'negative', label: 'Negative' },
  { key: 'mixed',    label: 'Mixed' },
  { key: 'auto',     label: 'Auto' },
];

export default function ModePicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {modes.map(m => (
        <button
          key={m.key}
          type="button"
          onClick={() => onChange(m.key)}
          className={[
            'px-3 py-2 rounded-xl border text-sm transition',
            value === m.key
              ? 'bg-white/10 border-white/30'
              : 'bg-white/5 hover:bg-white/10 border-white/10'
          ].join(' ')}
          aria-pressed={value === m.key}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
