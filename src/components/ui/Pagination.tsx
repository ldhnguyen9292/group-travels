import { useI18n } from '../../i18n/context';
import Button from './Button';
import { IconChevronLeft, IconChevronRight } from './Icons';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-4 flex items-center justify-center gap-3" aria-label={t.common.page}>
      <Button
        variant="secondary"
        size="icon-sm"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label={t.common.previous}
      >
        <IconChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm text-ink-muted" aria-live="polite">
        {t.common.page} {page} {t.common.of} {totalPages}
      </span>
      <Button
        variant="secondary"
        size="icon-sm"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        aria-label={t.common.next}
      >
        <IconChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
