import { useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/context';
import { IconAlert } from './Icons';
import type { FieldError } from './formErrors';

export interface ErrorSummaryProps {
  errors: FieldError[];
  /** Raised on every rejected submit, so pressing Save twice re-announces. */
  submitCount: number;
}

/**
 * A rejected submit has to send focus somewhere or the reader is left sitting on
 * the button with no idea why nothing happened. A single bad field reads best at
 * the field itself; several need a list to land on, because the messages are
 * otherwise scattered down the form with nothing tying them together.
 */
export default function ErrorSummary({ errors, submitCount }: ErrorSummaryProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const handled = useRef(0);

  useEffect(() => {
    // Only a fresh submit moves focus. Errors also appear outside submit (adding a
    // duplicate member, say), and stealing focus mid-typing would be worse than silence.
    if (submitCount === handled.current || errors.length === 0) return;
    handled.current = submitCount;
    if (errors.length === 1) document.getElementById(errors[0].id)?.focus();
    else panelRef.current?.focus();
  }, [submitCount, errors]);

  if (errors.length < 2) return null;

  return (
    <div
      ref={panelRef}
      tabIndex={-1}
      role="alert"
      className="rounded-control border border-bad bg-bad-soft px-4 py-3 text-sm text-bad"
    >
      <p className="flex items-center gap-2 font-semibold">
        <IconAlert className="h-4 w-4 shrink-0" />
        {t.common.errorSummary}
      </p>
      <ul className="mt-1.5 list-disc space-y-1 ps-5">
        {errors.map((error) => (
          <li key={error.id}>
            <button
              type="button"
              className="text-left underline underline-offset-2"
              onClick={() => document.getElementById(error.id)?.focus()}
            >
              {error.message}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
