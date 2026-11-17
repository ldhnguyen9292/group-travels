import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';
import { initialGuideOpen, loadGuidePreference, saveGuidePreference } from '../lib/homeGuide';
import { IconChevronDown, IconSparkle } from './ui/Icons';
import { cx } from './ui/classes';

export default function GuideCard({ hasTrips }: { hasTrips: boolean }) {
  const { t } = useI18n();
  const panelId = useId();
  const [open, setOpen] = useState(() => initialGuideOpen(loadGuidePreference(), hasTrips));

  function toggle() {
    setOpen((current) => {
      saveGuidePreference(!current);
      return !current;
    });
  }

  return (
    <section className="card mb-6 p-0">
      <button
        type="button"
        className="flex w-full items-center gap-2.5 px-5 py-4 text-left"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        title={open ? t.homeGuide.hide : t.homeGuide.show}
      >
        <span className="puck h-7 w-7">
          <IconSparkle className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 text-base font-semibold">{t.homeGuide.title}</span>
        <IconChevronDown
          className={cx('h-4 w-4 shrink-0 text-ink-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div id={panelId} className="border-t border-border px-5 py-4">
          <ol className="space-y-3">
            {t.homeGuide.steps.map((step, index) => (
              <li key={step} className="flex items-start gap-3 text-sm">
                <span className="puck h-6 w-6 shrink-0 text-xs font-semibold">{index + 1}</span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          <div className="mt-4 text-right">
            <Link to="/help" className="link text-sm">
              {t.homeGuide.moreHelp} →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
