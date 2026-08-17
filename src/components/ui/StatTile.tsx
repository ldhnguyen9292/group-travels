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
    /**
     * The icon sits on the label's row rather than in a left rail, which hands
     * the amount the tile's full width. In a two-column grid on a 390px phone
     * the rail left roughly 97px for the value, and a figure like ₫11,000,000
     * broke across two lines with a single digit stranded on the second.
     */
    <div className="tile flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        {icon && <span className={cx('puck h-7 w-7', PUCK_TONES[tone])}>{icon}</span>}
        {/* Wraps instead of truncating: "Paid into the fund" is not guessable from "Paid into the…". */}
        <p className="min-w-0 text-xs font-medium tracking-wide text-ink-muted uppercase">
          {label}
        </p>
      </div>
      <p className={cx('money text-lg font-semibold sm:text-xl', VALUE_TONES[tone])}>{value}</p>
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
