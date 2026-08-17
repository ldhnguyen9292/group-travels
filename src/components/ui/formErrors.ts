export interface FieldError {
  /** id of the control the message belongs to, so focus can be moved to it. */
  id: string;
  message: string;
}

/**
 * Drops the fields that passed and keeps the rest in the order they appear on
 * screen, so an error summary reads in the same sequence the reader will work
 * through. Lives apart from `ErrorSummary` because that file exports a component.
 */
export function collectErrors(entries: [string, string | undefined][]): FieldError[] {
  return entries
    .filter((entry): entry is [string, string] => Boolean(entry[1]))
    .map(([id, message]) => ({ id, message }));
}
