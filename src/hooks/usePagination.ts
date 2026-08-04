import { useEffect, useMemo, useState } from 'react';

export interface Pagination<T> {
  page: number;
  totalPages: number;
  items: T[];
  setPage: (page: number) => void;
}

/**
 * Paginates a list and keeps the page in range: deleting the last item on the
 * final page moves you back instead of showing an empty list.
 */
export function usePagination<T>(items: T[], pageSize: number): Pagination<T> {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(Math.max(page, 1), totalPages);

  useEffect(() => {
    if (page !== current) setPage(current);
  }, [page, current]);

  const visible = useMemo(
    () => items.slice((current - 1) * pageSize, current * pageSize),
    [items, current, pageSize],
  );

  return { page: current, totalPages, items: visible, setPage };
}
