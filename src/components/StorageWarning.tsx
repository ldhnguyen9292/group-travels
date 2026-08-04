import { useI18n } from '../i18n/context';
import { useTripStore } from '../store/context';
import { IconAlert } from './ui/Icons';

/** Shown when the browser refuses to write to localStorage (full, or blocked). */
export default function StorageWarning() {
  const { persistFailed } = useTripStore();
  const { t } = useI18n();
  if (!persistFailed) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-start gap-2.5 rounded-xl border border-bad bg-bad-soft px-4 py-3 text-sm text-bad"
    >
      <IconAlert className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{t.errors.storageFull}</span>
    </div>
  );
}
