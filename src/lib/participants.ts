import type { ID, Trip } from '../types/trip';

export function participantNames(trip: Trip): Map<ID, string> {
  return new Map(trip.participants.map((person) => [person.id, person.name]));
}

/** Records can outlive a member (imported backups, edited trips) — never render blank. */
export function nameOf(names: Map<ID, string>, id: ID, fallback: string): string {
  return names.get(id) ?? fallback;
}

/**
 * Up to two letters for an avatar bubble. Uses the first and last word so
 * "Nguyen Van An" reads NA; a single word keeps just its first letter.
 * `[...word]` splits by code point, so an emoji or accented letter stays whole.
 */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = [...words[0]][0] ?? '';
  const last = words.length > 1 ? ([...words[words.length - 1]][0] ?? '') : '';
  return (first + last).toLocaleUpperCase();
}
