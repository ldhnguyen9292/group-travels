import type { ID, Trip } from '../types/trip';

export function participantNames(trip: Trip): Map<ID, string> {
  return new Map(trip.participants.map((person) => [person.id, person.name]));
}

/** Records can outlive a member (imported backups, edited trips) — never render blank. */
export function nameOf(names: Map<ID, string>, id: ID, fallback: string): string {
  return names.get(id) ?? fallback;
}
