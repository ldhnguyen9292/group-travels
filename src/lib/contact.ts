export const CONTACT_EMAIL = 'repagtor@gmail.com';

/**
 * Builds a mailto link. `URLSearchParams` encodes spaces as `+`, which many mail
 * clients show literally in a subject line, so they are re-encoded as %20.
 */
export function mailtoLink(subject: string, body?: string): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set('body', body);
  return `mailto:${CONTACT_EMAIL}?${params.toString().replace(/\+/g, '%20')}`;
}
