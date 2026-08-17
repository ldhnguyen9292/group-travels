import { cloneElement, isValidElement, type ReactNode } from 'react';
import { cx } from './classes';

export interface FieldProps {
  id: string;
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** The two props Field injects into whichever control it wraps. */
interface Described {
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
}

export default function Field({ id, label, error, hint, className, children }: FieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = error ? errorId : hint ? hintId : undefined;

  /**
   * A message next to a control is not attached to it: a screen reader reads the
   * field, announces nothing wrong, and the red border it would rely on instead
   * is invisible to it. Wiring the association here rather than at each call site
   * is deliberate — it is then impossible to forget when a new field is added.
   */
  const control = isValidElement<Described>(children)
    ? cloneElement(children, {
      'aria-invalid': error ? true : undefined,
      'aria-describedby': describedBy,
    })
    : children;

  return (
    <div className={cx('min-w-0', className)}>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {control}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : (
        hint && (
          <p className="field-hint" id={hintId}>
            {hint}
          </p>
        )
      )}
    </div>
  );
}
