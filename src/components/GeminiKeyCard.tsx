import { useEffect, useId, useState } from 'react';
import { useGeminiKey } from '../hooks/useGeminiKey';
import { useI18n } from '../i18n/context';
import { ReceiptScanError, checkGeminiKey, saveGeminiKey } from '../lib/receiptAi';
import Button from './ui/Button';
import { IconAlert, IconCheck, IconTrash } from './ui/Icons';
import { input } from './ui/classes';

type Notice = { kind: 'ok' | 'error'; text: string } | null;

export default function GeminiKeyCard() {
  const { t } = useI18n();
  const fieldId = useId();
  const saved = useGeminiKey();
  const [draft, setDraft] = useState(saved);
  const [reveal, setReveal] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  // Another tab saving or removing the key is the newer truth.
  useEffect(() => setDraft(saved), [saved]);

  const errorText = (error: unknown) => {
    const code = error instanceof ReceiptScanError ? error.code : 'unknown';
    if (code === 'invalid-key') return t.receipt.errorInvalidKey;
    if (code === 'network') return t.receipt.errorNetwork;
    if (code === 'quota') return t.receipt.errorQuota;
    if (code === 'busy') return t.receipt.errorBusy;
    return t.receipt.errorUnknown;
  };

  function save() {
    setNotice(
      saveGeminiKey(draft)
        ? { kind: 'ok', text: draft.trim() ? t.ai.saved : t.ai.removed }
        : { kind: 'error', text: t.ai.saveFailed },
    );
  }

  async function check() {
    setChecking(true);
    setNotice(null);
    try {
      await checkGeminiKey(draft.trim());
      setNotice({ kind: 'ok', text: t.ai.valid });
    } catch (error) {
      setNotice({ kind: 'error', text: errorText(error) });
    } finally {
      setChecking(false);
    }
  }

  function remove() {
    setDraft('');
    setNotice(saveGeminiKey('') ? { kind: 'ok', text: t.ai.removed } : { kind: 'error', text: t.ai.saveFailed });
  }

  return (
    <section className="card p-6">
      <h2 className="text-base font-semibold">{t.ai.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t.ai.body}</p>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{t.ai.freeTierNote}</p>
      <a
        className="link mt-2 inline-block text-sm"
        href="https://aistudio.google.com/apikey"
        target="_blank"
        rel="noreferrer"
      >
        {t.ai.getKey} ↗
      </a>

      <label className="label mt-4" htmlFor={`${fieldId}-key`}>
        {t.ai.label}
      </label>
      <div className="flex gap-2">
        <input
          id={`${fieldId}-key`}
          type={reveal ? 'text' : 'password'}
          className={input(false, 'min-w-0 flex-1 font-mono')}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t.ai.placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        <Button variant="ghost" onClick={() => setReveal((value) => !value)}>
          {reveal ? t.common.hide : t.common.show}
        </Button>
      </div>
      {saved && !notice && (
        <p className="field-hint flex items-center gap-1.5 text-good">
          <IconCheck className="h-3.5 w-3.5" />
          {t.ai.active}
        </p>
      )}

      {notice && (
        <p
          role={notice.kind === 'error' ? 'alert' : 'status'}
          className={
            notice.kind === 'error'
              ? 'mt-3 flex items-center gap-2 rounded-xl border border-bad bg-bad-soft px-3.5 py-2.5 text-sm text-bad'
              : 'mt-3 flex items-center gap-2 rounded-xl border border-good bg-good-soft px-3.5 py-2.5 text-sm text-good'
          }
        >
          {notice.kind === 'error' ? (
            <IconAlert className="h-4 w-4 shrink-0" />
          ) : (
            <IconCheck className="h-4 w-4 shrink-0" />
          )}
          {notice.text}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={save} disabled={draft.trim() === saved}>
          {t.ai.save}
        </Button>
        <Button variant="secondary" onClick={() => void check()} disabled={!draft.trim() || checking}>
          {checking ? t.ai.checking : t.ai.check}
        </Button>
        {saved && (
          <Button variant="danger-ghost" onClick={remove}>
            <IconTrash className="h-4 w-4" />
            {t.ai.remove}
          </Button>
        )}
      </div>
    </section>
  );
}
