import { useI18n } from '../i18n/context';
import { CONTACT_EMAIL, mailtoLink } from '../lib/contact';
import { IconAlert, IconPlus } from './ui/Icons';
import { btn } from './ui/classes';

/**
 * The address is shown as text as well as wired to the buttons: a `mailto:` link
 * does nothing on a desktop with no mail client configured, and people still
 * need to be able to copy it.
 */
export default function FeedbackCard() {
  const { t } = useI18n();

  return (
    <section className="card p-6">
      <h2 className="text-base font-semibold">{t.feedback.title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">{t.feedback.body}</p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          className={btn('primary')}
          href={mailtoLink(t.feedback.subjectBug, t.feedback.bugTemplate)}
        >
          <IconAlert className="h-4 w-4" />
          {t.feedback.reportBug}
        </a>
        <a
          className={btn('secondary')}
          href={mailtoLink(t.feedback.subjectFeature, t.feedback.featureTemplate)}
        >
          <IconPlus className="h-4 w-4" />
          {t.feedback.suggestFeature}
        </a>
      </div>

      <p className="mt-3.5 text-sm text-ink-muted">
        {t.feedback.orEmailDirectly}{' '}
        <a className="link break-all" href={`mailto:${CONTACT_EMAIL}`}>
          {CONTACT_EMAIL}
        </a>
      </p>
    </section>
  );
}
