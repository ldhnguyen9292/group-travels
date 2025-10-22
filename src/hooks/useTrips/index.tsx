import { useCallback, useEffect, useState } from 'react';
import type { Trip } from '../../types';

const STORAGE_KEYS = ['groupTrips', 'groupTrips_v1'];

function readStorage(): Trip[] {
  try {
    for (const k of STORAGE_KEYS) {
      const raw = localStorage.getItem(k);
      if (raw) return JSON.parse(raw) as Trip[];
    }
    return [];
  } catch {
    return [];
  }
}

function writeStorage(trips: Trip[]) {
  try {
    localStorage.setItem(STORAGE_KEYS[0], JSON.stringify(trips));
  } catch {
    // ignore
  }
}

export default function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    setTrips(readStorage());
  }, []);

  useEffect(() => {
    writeStorage(trips);
  }, [trips]);

  const addTrip = useCallback((data: Omit<Trip, 'id' | 'createdAt'>) => {
    const id = Date.now().toString();
    const newTrip: Trip = { ...data, id, createdAt: new Date().toISOString() };
    setTrips((s) => [newTrip, ...s]);
    return newTrip;
  }, []);

  const deleteTrip = useCallback((id: string) => {
    setTrips((s) => s.filter((t) => t.id !== id));
  }, []);

  const getById = useCallback((id: string) => {
    return trips.find((t) => t.id === id) ?? null;
  }, [trips]);

  const updateTrip = useCallback((id: string, patch: Partial<Trip>) => {
    setTrips((s) => s.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  return { trips, addTrip, deleteTrip, getById, updateTrip };
}