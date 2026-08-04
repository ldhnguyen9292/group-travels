import { canNativeShare, nativeShare, useClipboard } from '../hooks/useClipboard';
import { useI18n } from '../i18n/context';
import Button from './ui/Button';
import { IconCheck, IconShare } from './ui/Icons';
import Modal from './ui/Modal';

export interface ShareDialogProps {
  open: boolean;
  /** Used as the share sheet title; the dialog heading comes from the dictionary. */
  subject: string;
  text: string;
  onClose: () => void;
}

export default function ShareDialog({ open, subject, text, onClose }: ShareDialogProps) {
  const { t } = useI18n();
  const { status, copy } = useClipboard();
  const native = canNativeShare();

  return (
    <Modal open={open} title={t.share.dialogTitle} onClose={onClose} widthClass="max-w-lg">
      <p className="text-sm leading-relaxed text-ink-muted">{t.share.hint}</p>

      {/* Read-only and selected on open, so Ctrl/Cmd+C works even if copy is blocked. */}
      <textarea
        readOnly
        value={text}
        rows={12}
        aria-label={t.share.dialogTitle}
        className="input mt-3 resize-y font-mono text-xs leading-relaxed"
        onFocus={(event) => event.currentTarget.select()}
      />

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button variant={native ? 'secondary' : 'primary'} onClick={() => void copy(text)}>
          {status === 'copied' ? <IconCheck className="h-4 w-4" /> : null}
          {status === 'copied' ? t.share.copied : t.share.copy}
        </Button>
        {native && (
          <Button onClick={() => void nativeShare(subject, text)}>
            <IconShare className="h-4 w-4" />
            {t.share.shareAction}
          </Button>
        )}
      </div>

      {status === 'failed' && (
        <p className="field-error" role="alert">
          {t.share.copyFailed}
        </p>
      )}
    </Modal>
  );
}
