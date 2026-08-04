export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger' | 'danger-ghost';

export type ButtonSize = 'md' | 'sm' | 'icon' | 'icon-sm';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  soft: 'btn-soft',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  'danger-ghost': 'btn-danger-ghost',
};

const SIZES: Record<ButtonSize, string> = {
  md: '',
  sm: 'btn-sm',
  icon: 'btn-icon',
  'icon-sm': 'btn-icon btn-sm',
};

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

/** Button classes, also used by router `Link`s that should look like buttons. */
export function btn(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
): string {
  return cx('btn', VARIANTS[variant], SIZES[size], className);
}

export function input(invalid?: boolean, className?: string): string {
  return cx('input', invalid && 'input-invalid', className);
}
