import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { btn, type ButtonSize, type ButtonVariant } from './classes';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children?: ReactNode;
}

/**
 * Defaults to `type="button"` on purpose: a bare <button> inside a form submits
 * it, which is the classic source of "the form saved when I clicked delete".
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button type={type} className={btn(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}
