import { initials } from '../../lib/participants';
import { cx } from './classes';

export interface AvatarProps {
  name: string;
  className?: string;
}

/** Initials bubble. Decorative next to a visible name, hence `title` only. */
export default function Avatar({ name, className }: AvatarProps) {
  return (
    <span className={cx('avatar', className)} title={name} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
