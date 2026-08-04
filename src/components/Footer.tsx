import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/context';

export default function Footer() {
  const { t } = useI18n();

  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <img src="/group-travel-logo.svg" alt="" className="h-8 w-8" />
          <span className="font-semibold">{t.app.name}</span>
        </Link>
        <p className="max-w-md text-sm leading-relaxed text-ink-muted">{t.footer.desc}</p>
        <p className="text-xs text-ink-muted">
          © {new Date().getFullYear()} {t.app.name}. {t.footer.copyright}
        </p>
      </div>
    </footer>
  );
}
