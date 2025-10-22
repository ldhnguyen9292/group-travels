import React, { useEffect, useState } from 'react';
import type { Participant, Trip } from '../types/trip';

type Props = {
  onAdd: (data: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>) => void;
  initialData?: Omit<Trip, 'id' | 'createdAt'>;
  onCancel?: () => void;
};

const translations = {
  en: {
    createTrip: 'Create trip',
    show: 'Show',
    hide: 'Hide',
    tripName: 'Trip name',
    addParticipants: 'Add participants (comma separated)',
    add: 'Add',
    saveTrip: 'Save trip',
    participants: 'Participants:',
    remove: 'Remove',
    startDate: 'Start date',
    endDate: 'End date',
  },
  vn: {
    createTrip: 'Tạo chuyến đi',
    show: 'Hiện',
    hide: 'Ẩn',
    tripName: 'Tên chuyến đi',
    addParticipants: 'Thêm thành viên (phân tách bằng dấu phẩy)',
    add: 'Thêm',
    saveTrip: 'Lưu chuyến đi',
    participants: 'Thành viên:',
    remove: 'Xóa',
    startDate: 'Ngày bắt đầu',
    endDate: 'Ngày kết thúc',
  },
};

const TripForm: React.FC<Props> = ({ onAdd, initialData, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [participantInput, setParticipantInput] = useState('');
  const [participants, setParticipants] = useState<Participant[]>(initialData?.participants || []);
  const [lang, setLang] = useState('en');
  const [errors, setErrors] = useState<{ name?: string; startDate?: string; participants?: string }>({});
  useEffect(() => {
    const handler = (e: CustomEvent) => setLang((e.detail && e.detail.lang) || 'en');
    window.addEventListener('app:language-changed', handler as EventListener);
    setLang(localStorage.getItem('lang') || 'en');
    return () => window.removeEventListener('app:language-changed', handler as EventListener);
  }, []);
  const t = translations[lang as 'en' | 'vn'] || translations.en;

  function addParticipantFromInput() {
    const v = participantInput.trim();
    if (!v) return;
    const list = v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name) => ({
        id: `${name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
      }));
    setParticipants((p) => {
      const names = new Set(p.map((pt) => pt.name));
      return [...p, ...list.filter((pt) => !names.has(pt.name))];
    });
    setParticipantInput('');
  }

  function removeParticipant(idx: number) {
    setParticipants((p) => p.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors: { name?: string; startDate?: string; participants?: string } = {};
    if (!name.trim()) newErrors.name = t.tripName + ' is required';
    if (!startDate) newErrors.startDate = 'Start date is required';
    if (participants.length === 0) newErrors.participants = 'At least one member is required';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    const userDevice = localStorage.getItem('userDevice') || '';
    onAdd({
      name: name.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      participants,
      userDevice,
    });
    setName('');
    setStartDate('');
    setEndDate('');
    setParticipants([]);
    setParticipantInput('');
    setErrors({});
    if (onCancel) onCancel();
  }

  return (
    <section className="mb-6">
      <div className="flex items-center gap-4 mb-4">
        <h3 className="text-xl font-semibold m-0 flex-1">{t.createTrip}</h3>
        {onCancel && (
          <button
            onClick={onCancel}
            aria-label={t.hide}
            className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded border border-gray-200 bg-gray-100"
          >
            {t.hide}
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t.tripName}</label>
            <input
              className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
              placeholder={t.tripName}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <div className="text-red-500 text-xs mt-1">{errors.name}</div>}
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{t.startDate}</label>
              <input
                type="date"
                className={`w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.startDate ? 'border-red-400' : 'border-gray-300'}`}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {errors.startDate && <div className="text-red-500 text-xs mt-1">{errors.startDate}</div>}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">{t.endDate}</label>
              <input
                type="date"
                className="w-full rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t.participants}</label>
          <div className="flex gap-2 mb-2">
            <input
              className={`flex-1 rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.participants ? 'border-red-400' : 'border-gray-300'}`}
              placeholder={t.addParticipants}
              value={participantInput}
              onChange={(e) => setParticipantInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addParticipantFromInput();
                }
              }}
            />
            <button
              type="button"
              onClick={addParticipantFromInput}
              className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
            >
              {t.add}
            </button>
          </div>
          {errors.participants && <div className="text-red-500 text-xs mb-2">{errors.participants}</div>}
          {participants.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {participants.map((p, idx) => (
                <li key={p.id} className="flex items-center gap-2 mb-1">
                  <span>{p.name}</span>
                  <button type="button" className="text-xs text-red-500" onClick={() => removeParticipant(idx)}>
                    {t.remove}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow"
          >
            {t.saveTrip}
          </button>
        </div>
      </form>
    </section>
  );
};

export default TripForm;
