import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from '../../i18n/context';
import Button from './Button';
import { IconClose } from './Icons';
import { cx } from './classes';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Tailwind max-width class, e.g. `max-w-lg`. */
  widthClass?: string;
}

export default function Modal({ open, title, onClose, children, widthClass }: ModalProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const panel = panelRef.current;
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panel) return;

      // Keep focus inside the dialog instead of wandering behind the backdrop.
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (element) => element.offsetParent !== null,
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || active === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const target = panel.querySelector<HTMLElement>(
      '[data-autofocus], input:not([type="hidden"]), select, textarea',
    );
    (target ?? panel).focus();
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={cx('modal-panel', widthClass)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <h2 id={titleId} className="min-w-0 flex-1 text-lg font-semibold">
            {title}
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label={t.common.close}>
            <IconClose className="h-4 w-4" />
          </Button>
        </div>
        <div className="px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
