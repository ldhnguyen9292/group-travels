import type { ReactNode } from 'react';
import { cx } from './classes';

export type StatTone = 'neutral' | 'brand' | 'good' | 'bad';

const VALUE_TONES: Record<StatTone, string> = {
  neutral: 'text-ink',
  brand: 'text-brand',
  good: 'text-good',
  bad: 'text-bad',
};

const PUCK_TONES: Record<StatTone, string> = {
  neutral: 'puck-neutral',
  brand: '',
  good: 'puck-good',
  bad: 'puck-bad',
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
    <div className="tile flex items-start gap-3">
      {icon && <span className={cx('puck mt-0.5 h-8 w-8', PUCK_TONES[tone])}>{icon}</span>}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-medium tracking-wide text-ink-muted uppercase">
          {label}
        </p>
        <p className={cx('money mt-1 text-lg font-semibold sm:text-xl', VALUE_TONES[tone])}>
          {value}
        </p>
        {hint && <p className="mt-0.5 text-xs text-ink-muted">{hint}</p>}
      </div>
    </div>
  );
}
