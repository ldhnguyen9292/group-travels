import { useI18n } from '../../i18n/context';
import Button from './Button';
import Modal from './Modal';
import type { ButtonVariant } from './classes';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body?: string;
  confirmLabel?: string;
  confirmVariant?: ButtonVariant;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  return (
    <Modal open={open} title={title} onClose={onCancel} widthClass="max-w-md">
      {body && <p className="text-sm leading-relaxed text-ink-muted">{body}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} data-autofocus>
          {confirmLabel ?? t.common.delete}
        </Button>
      </div>
    </Modal>
  );
}
