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

  function editContribution(
    contributionId: string,
    updatedData: Omit<Contribution, 'id' | 'tripId' | 'createdAt' | 'updatedAt'>
  ) {
    if (!tripId) return;
    const updated = contributions.map((c) =>
      c.id === contributionId ? { ...c, ...updatedData, updatedAt: new Date().toISOString() } : c
    );
    setContributions(updated);
    localStorage.setItem(`contributions${tripId}`, JSON.stringify(updated));
  }

  function removeContribution(contributionId: string) {
    if (!tripId) return;
    const updated = contributions.filter((c) => c.id !== contributionId);
    setContributions(updated);
    localStorage.setItem(`contributions${tripId}`, JSON.stringify(updated));
  }

  return { contributions, addContribution, editContribution, removeContribution };
}
