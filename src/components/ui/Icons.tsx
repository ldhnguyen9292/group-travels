import type { ReactNode } from 'react';

export interface IconProps {
  className?: string;
}

function Outline({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      className={className ?? 'h-5 w-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function IconSun({ className }: IconProps) {
  return (
    <Outline className={className}>
      <circle cx="12" cy="12" r="4.25" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
    </Outline>
  );
}

export function IconMoon({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M20 14.5A8.5 8.5 0 019.5 4a7.5 7.5 0 1010.5 10.5z" />
    </Outline>
  );
}

export function IconMenu({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Outline>
  );
}

export function IconClose({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Outline>
  );
}

export function IconPlus({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M12 5v14M5 12h14" />
    </Outline>
  );
}

export function IconPencil({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M4 20h4l10-10a2.4 2.4 0 00-3.4-3.4L4.6 16.6V20z" />
      <path d="M13.5 7.5l3 3" />
    </Outline>
  );
}

export function IconTrash({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M4 7h16M9.5 7V5h5v2M6 7l1 13h10l1-13" />
      <path d="M10.5 11v5.5M13.5 11v5.5" />
    </Outline>
  );
}

export function IconArrowLeft({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </Outline>
  );
}

export function IconChevronLeft({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M14.5 6l-6 6 6 6" />
    </Outline>
  );
}

export function IconChevronRight({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M9.5 6l6 6-6 6" />
    </Outline>
  );
}

export function IconChevronDown({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M6 9.5l6 6 6-6" />
    </Outline>
  );
}

export function IconUsers({ className }: IconProps) {
  return (
    <Outline className={className}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M3.5 19.5a5.5 5.5 0 0111 0" />
      <path d="M16 5.6a3.25 3.25 0 010 4.8M18.2 19.5a5.6 5.6 0 00-2-4.1" />
    </Outline>
  );
}

export function IconWallet({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M3.5 8.5A2 2 0 015.5 6.5h13a2 2 0 012 2v9a2 2 0 01-2 2h-13a2 2 0 01-2-2z" />
      <path d="M3.5 10.5h17M16.5 14.5h2" />
    </Outline>
  );
}

export function IconReceipt({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M6 3.5h12v17l-3-1.6-3 1.6-3-1.6-3 1.6z" />
      <path d="M9 8.5h6M9 12.5h6" />
    </Outline>
  );
}

export function IconScale({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M12 4.5v15M7 19.5h10" />
      <path d="M4 9.5h6l-3 5.5-3-5.5zM14 9.5h6l-3 5.5-3-5.5z" />
      <path d="M12 6.5l-8 3M12 6.5l8 3" />
    </Outline>
  );
}

export function IconSearch({ className }: IconProps) {
  return (
    <Outline className={className}>
      <circle cx="10.5" cy="10.5" r="5.5" />
      <path d="M15 15l4.5 4.5" />
    </Outline>
  );
}

export function IconDownload({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5" />
      <path d="M4.5 19.5h15" />
    </Outline>
  );
}

export function IconUpload({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M12 15V4M7.5 8.5L12 4l4.5 4.5" />
      <path d="M4.5 19.5h15" />
    </Outline>
  );
}

export function IconGlobe({ className }: IconProps) {
  return (
    <Outline className={className}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.4 3.3 5.3 3.3 8.5s-1.1 6.1-3.3 8.5c-2.2-2.4-3.3-5.3-3.3-8.5S9.8 5.9 12 3.5z" />
    </Outline>
  );
}

export function IconCheck({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </Outline>
  );
}

export function IconAlert({ className }: IconProps) {
  return (
    <Outline className={className}>
      <path d="M12 4.5l8.5 15h-17l8.5-15z" />
      <path d="M12 10v4M12 16.8v.2" />
    </Outline>
  );
}
