import type { ReactNode } from 'react';
import { cx } from './classes';

export type StatTone = 'neutral' | 'brand' | 'good' | 'bad';

const TONES: Record<StatTone, string> = {
  neutral: 'text-ink',
  brand: 'text-brand',
  good: 'text-good',
  bad: 'text-bad',
};

export interface StatTileProps {
  label: string;
  value: string;
  icon?: ReactNode;
  tone?: StatTone;
  hint?: string;
}

export default function StatTile({ label, value, icon, tone = 'neutral', hint }: StatTileProps) {
  return (
    <div className="tile">
      <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-ink-muted uppercase">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <p className={cx('mt-1.5 text-xl font-semibold tabular-nums', TONES[tone])}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
