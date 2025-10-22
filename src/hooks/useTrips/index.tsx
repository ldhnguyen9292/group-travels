import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import type { Trip } from '../../types/trip';

const API_URL = 'https://6044315ca20ace001728eb71.mockapi.io/api/trip';

export default function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all trips on mount
  useEffect(() => {
    setLoading(true);
    axios
      .get(API_URL)
      .then((res) => setTrips(res.data))
      .catch(() => setError('Failed to fetch trips'))
      .finally(() => setLoading(false));
  }, []);

  // Add trip (POST)
  const addTrip = useCallback(async (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const userDevice = localStorage.getItem('userDevice') || '';
      const res = await axios.post(API_URL, { ...data, createdAt: now, updatedAt: now, userDevice });
      const newTrip = res.data;
      setTrips((s) => [newTrip, ...s]);
      return newTrip;
    } catch {
      setError('Failed to add trip');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete trip (DELETE)
  const deleteTrip = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`${API_URL}/${id}`);
      setTrips((s) => s.filter((t) => t.id !== id));
    } catch {
      setError('Failed to delete trip');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get by id (local only)
  const getById = useCallback(
    (id: string) => {
      return trips.find((t) => t.id === id) ?? null;
    },
    [trips]
  );

  // Update trip (PUT)
  const updateTrip = useCallback(async (id: string, patch: Partial<Trip>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.put(`${API_URL}/${id}`, { ...patch, updatedAt: new Date().toISOString() });
      const updated = res.data;
      setTrips((s) => s.map((t) => (t.id === id ? updated : t)));
      return updated;
    } catch {
      setError('Failed to update trip');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { trips, addTrip, deleteTrip, getById, updateTrip, loading, error };
}
