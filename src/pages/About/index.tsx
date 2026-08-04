import { useRef, useState } from 'react';
import FeedbackCard from '../../components/FeedbackCard';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { IconAlert, IconCheck, IconDownload, IconTrash, IconUpload } from '../../components/ui/Icons';
import { useI18n } from '../../i18n/context';
import { CONTACT_EMAIL } from '../../lib/contact';
import { todayISO } from '../../lib/date';
import { DATA_VERSION, parseImportedData, type AppData } from '../../lib/storage';
import { useTripStore } from '../../store/context';

type Notice = { kind: 'ok' | 'error'; text: string } | null;

export default function About() {
  const { t } = useI18n();
  const { trips, expenses, contributions, replaceAll, clearAll } = useTripStore();
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [pendingImport, setPendingImport] = useState<AppData | null>(null);
  const [clearOpen, setClearOpen] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  function handleExport() {
    const data: AppData = { version: DATA_VERSION, trips, expenses, contributions };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `group-travel-backup-${todayISO()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function handleFile(file: File) {
    const parsed = parseImportedData(await file.text());
    if (!parsed) {
      setNotice({ kind: 'error', text: t.about.importError });
      return;
    }
    setNotice(null);
    setPendingImport(parsed);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <section className="hero p-6">
        <h1 className="text-2xl font-semibold sm:text-3xl">{t.about.title}</h1>
        <p className="mt-3 leading-relaxed text-ink-muted">{t.about.desc}</p>

        <h2 className="mt-6 text-base font-semibold">{t.about.featuresTitle}</h2>
        <ul className="mt-2 space-y-1.5">
          {t.about.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm">
              <IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold">{t.about.privacyTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t.about.privacyBody}</p>
      </section>

      <section className="card p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-base font-semibold">{t.about.dataTitle}</h2>
          <p className="text-xs text-ink-muted">
            {t.about.stats}: {trips.length} {t.about.tripsStored}
          </p>
        </div>

        {notice && (
          <p
            role="alert"
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

        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="min-w-0 flex-1 text-sm text-ink-muted">{t.about.exportHint}</p>
            <Button variant="secondary" onClick={handleExport} disabled={trips.length === 0}>
              <IconDownload className="h-4 w-4" />
              {t.about.exportAction}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="min-w-0 flex-1 text-sm text-ink-muted">{t.about.importHint}</p>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                // Reset so picking the same file again still fires a change event.
                event.target.value = '';
                if (file) void handleFile(file);
              }}
            />
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              <IconUpload className="h-4 w-4" />
              {t.about.importAction}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <p className="min-w-0 flex-1 text-sm text-ink-muted">{t.about.clearHint}</p>
            <Button
              variant="danger-ghost"
              onClick={() => setClearOpen(true)}
              disabled={trips.length === 0}
            >
              <IconTrash className="h-4 w-4" />
              {t.about.clearAction}
            </Button>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-base font-semibold">{t.about.developerTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t.about.developerDesc}</p>
        <p className="mt-3 text-sm text-ink-muted">
          {t.feedback.orEmailDirectly}{' '}
          <a className="link break-all" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </p>
        <p className="mt-4 border-t border-border pt-4 text-xs text-ink-muted">{t.about.version}</p>
      </section>

      <FeedbackCard />

      <ConfirmDialog
        open={pendingImport !== null}
        title={t.about.importTitle}
        body={t.about.importBody}
        confirmLabel={t.about.importAction}
        confirmVariant="primary"
        onConfirm={() => {
          if (pendingImport) replaceAll(pendingImport);
          setPendingImport(null);
          setNotice({ kind: 'ok', text: t.about.importSuccess });
        }}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={clearOpen}
        title={t.about.clearTitle}
        body={t.about.clearBody}
        confirmLabel={t.about.clearAction}
        onConfirm={() => {
          clearAll();
          setClearOpen(false);
        }}
        onCancel={() => setClearOpen(false)}
      />
    </div>
  );
}
