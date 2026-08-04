import FeedbackCard from '../../components/FeedbackCard';
import { IconChevronDown } from '../../components/ui/Icons';
import { useI18n } from '../../i18n/context';

export default function Help() {
  const { t } = useI18n();

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{t.help.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t.help.intro}</p>
      </div>

      <section className="card border-brand-border bg-brand-soft p-6">
        <h2 className="text-base font-semibold text-brand">{t.help.modelTitle}</h2>
        <p className="mt-2 text-sm leading-relaxed">{t.help.modelBody}</p>
      </section>

      <div className="space-y-3">
        {t.help.faq.map((item) => (
          <details key={item.q} className="card group p-0">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
              <span>{item.q}</span>
              <IconChevronDown className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="border-t border-border px-4 py-3.5 text-sm leading-relaxed text-ink-muted">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <FeedbackCard />
    </div>
  );
}
