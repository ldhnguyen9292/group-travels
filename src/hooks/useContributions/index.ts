import { useState } from 'react';
import type { Contribution } from '../../types/trip';

export default function useContributions(tripId?: string) {
  const [contributions, setContributions] = useState<Contribution[]>(() => {
    if (!tripId) return [];
    try {
      return JSON.parse(localStorage.getItem(`contributions${tripId}`) || '[]');
    } catch {
      return [];
    }
  });

  function addContribution(contribution: Omit<Contribution, 'id' | 'createdAt' | 'updatedAt'>) {
    const newContribution: Contribution = {
      ...contribution,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tripId: tripId!,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const updated = [newContribution, ...contributions];
    setContributions(updated);
    localStorage.setItem(`contributions${tripId}`, JSON.stringify(updated));
  }

  // Optionally, add removeContribution/editContribution here

  return { contributions, addContribution, setContributions };
}
