export type ID = string;

export interface Trip {
  id: ID;
  name: string;
  startDate?: string;
  endDate?: string;
  participants: string[]; // migrated from comma-separated
  createdAt: string;
}
