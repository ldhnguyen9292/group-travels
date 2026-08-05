import { useEffect, useState } from 'react';
import { canNativeShare, downloadBlob, nativeShare, useClipboard } from '../hooks/useClipboard';
import { useI18n } from '../i18n/context';
import Button from './ui/Button';
import { IconCheck, IconDownload, IconShare } from './ui/Icons';
import Modal from './ui/Modal';

export interface ShareImage {
  /** Built on demand: most visitors never open the image half of this dialog. */
  create: () => Promise<Blob | null>;
  filename: string;
}

export interface ShareDialogProps {
  open: boolean;
  /** Used as the share sheet title; the dialog heading comes from the dictionary. */
  subject: string;
  text: string;
  /** When given, the dialog offers a picture of the expense table too. */
  image?: ShareImage | null;
  onClose: () => void;
}

type Parts = { text: boolean; image: boolean };

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="chip cursor-pointer">
      <input
        type="checkbox"
        className="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
      />
      {label}
    </label>
  );
}

export default function ShareDialog({ open, subject, text, image, onClose }: ShareDialogProps) {
  const { t } = useI18n();
  const { status, copy } = useClipboard();
  const native = canNativeShare();

  const [parts, setParts] = useState<Parts>({ text: true, image: false });
  const [blob, setBlob] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [failed, setFailed] = useState(false);

  // Drawn once per opening, and only once the image is actually asked for.
  useEffect(() => {
    if (!open || !image || !parts.image || blob) return;
    let live = true;
    setDrawing(true);
    setFailed(false);
    void image
      .create()
      .then((result) => {
        if (!live) return;
        setBlob(result);
        setFailed(result === null);
      })
      .catch(() => live && setFailed(true))
      .finally(() => live && setDrawing(false));
    return () => {
      live = false;
    };
  }, [open, image, parts.image, blob]);

  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    setPreview(url);
    return () => {
      URL.revokeObjectURL(url);
      setPreview(null);
    };
  }, [blob]);

  useEffect(() => {
    if (!open) {
      setBlob(null);
      setParts({ text: true, image: false });
    }
  }, [open]);

  const wantsImage = Boolean(image) && parts.image;
  const wantsText = parts.text;
  const nothingChosen = !wantsText && !wantsImage;
  const file = blob && image ? new File([blob], image.filename, { type: 'image/png' }) : null;

  const share = () =>
    void nativeShare(subject, wantsText ? text : '', wantsImage && file ? [file] : undefined);

  return (
    <Modal open={open} title={t.share.dialogTitle} onClose={onClose} widthClass="max-w-lg">
      <p className="text-sm leading-relaxed text-ink-muted">{t.share.hint}</p>

      {image && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{t.share.include}</span>
          <Toggle
            checked={parts.text}
            onChange={(next) => setParts((prev) => ({ ...prev, text: next }))}
            label={t.share.includeText}
          />
          <Toggle
            checked={parts.image}
            onChange={(next) => setParts((prev) => ({ ...prev, image: next }))}
            label={t.share.includeImage}
          />
        </div>
      )}

      {wantsText && (
        // Read-only and selected on open, so Ctrl/Cmd+C works even if copy is blocked.
        <textarea
          readOnly
          value={text}
          rows={wantsImage ? 7 : 12}
          aria-label={t.share.dialogTitle}
          className="input mt-3 resize-y font-mono text-xs leading-relaxed"
          onFocus={(event) => event.currentTarget.select()}
        />
      )}

      {/* The preview is scaled to fit: it is there to show what will be sent, and
          a wide table at native size shows one magnified corner of it. */}
      {wantsImage && (
        <div className="mt-3 flex justify-center rounded-xl border border-border bg-sunken p-2">
          {preview ? (
            <img
              src={preview}
              alt={t.share.includeImage}
              className="max-h-60 w-auto max-w-full rounded-lg"
            />
          ) : (
            <p className="px-2 py-6 text-center text-sm text-ink-muted">
              {failed ? t.share.imageFailed : t.share.imageBuilding}
            </p>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        {wantsText && (
          <Button variant="secondary" onClick={() => void copy(text)}>
            {status === 'copied' ? <IconCheck className="h-4 w-4" /> : null}
            {status === 'copied' ? t.share.copied : t.share.copy}
          </Button>
        )}
        {wantsImage && (
          <Button
            variant="secondary"
            disabled={!blob || drawing}
            onClick={() => blob && image && downloadBlob(blob, image.filename)}
          >
            <IconDownload className="h-4 w-4" />
            {t.share.saveImage}
          </Button>
        )}
        {native && (
          <Button onClick={share} disabled={nothingChosen || (wantsImage && !blob)}>
            <IconShare className="h-4 w-4" />
            {t.share.shareAction}
          </Button>
        )}
      </div>

      {nothingChosen && (
        <p className="field-hint mt-2 text-right" role="status">
          {t.share.pickSomething}
        </p>
      )}

      {status === 'failed' && (
        <p className="field-error" role="alert">
          {t.share.copyFailed}
        </p>
      )}
    </Modal>
  );
}
