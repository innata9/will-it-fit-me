import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { bodyShape, heightCategory } from './lib/body';
import type { ApiProfile } from './lib/api';
import type { Check, ColorTypeResult, FitEntry, Look, Measurements, WardrobeItem } from './types';

export const id = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export const DEFAULT_FOLDERS = ['Work', 'Weekend', 'Evening', 'Vacation'];

interface State {
  onboarded: boolean;
  measurements: Measurements;
  notes: string[];
  fitPreference: string;
  colorType: ColorTypeResult | null;
  /** In memory only — the selfie is never written to storage. */
  pendingSelfie: { base64: string; mediaType: string; uri: string } | null;
  checks: Check[];
  wardrobe: WardrobeItem[];
  folders: string[];
  looks: Look[];
  fitHistory: FitEntry[];
  priceAlerts: boolean;

  setMeasurement: (key: keyof Measurements, value: number | undefined) => void;
  setNotes: (notes: string[]) => void;
  setFitPreference: (v: string) => void;
  setPendingSelfie: (s: State['pendingSelfie']) => void;
  setColorType: (c: ColorTypeResult) => void;
  finishOnboarding: () => void;

  addCheck: (input: Pick<Check, 'url' | 'screenshot'>) => string;
  updateCheck: (id: string, patch: Partial<Check>) => void;
  removeCheck: (id: string) => void;
  toggleWish: (id: string) => void;

  addWardrobe: (item: Omit<WardrobeItem, 'id'>) => void;
  removeWardrobe: (id: string) => void;

  addFolder: (name: string) => boolean;
  saveLook: (look: Omit<Look, 'id' | 'createdAt'>) => string;
  moveLook: (id: string, folder: string) => void;
  removeLook: (id: string) => void;

  addFit: (entry: Omit<FitEntry, 'id' | 'createdAt'>) => void;
  setPriceAlerts: (on: boolean) => void;
  resetAll: () => void;
}

const initial = {
  onboarded: false,
  measurements: {} as Measurements,
  notes: [] as string[],
  fitPreference: 'depends on the item',
  colorType: null,
  pendingSelfie: null,
  checks: [] as Check[],
  wardrobe: [] as WardrobeItem[],
  folders: DEFAULT_FOLDERS,
  looks: [] as Look[],
  fitHistory: [] as FitEntry[],
  priceAlerts: true,
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      setMeasurement: (key, value) => set((s) => ({ measurements: { ...s.measurements, [key]: value } })),
      setNotes: (notes) => set({ notes }),
      setFitPreference: (fitPreference) => set({ fitPreference }),
      setPendingSelfie: (pendingSelfie) => set({ pendingSelfie }),
      setColorType: (colorType) => set({ colorType }),
      finishOnboarding: () => set({ onboarded: true }),

      addCheck: (input) => {
        const newId = id();
        const check: Check = { id: newId, createdAt: Date.now(), status: 'pending', wished: false, ...input };
        set((s) => ({ checks: [check, ...s.checks].slice(0, 100) }));
        return newId;
      },
      updateCheck: (cid, patch) => set((s) => ({ checks: s.checks.map((c) => (c.id === cid ? { ...c, ...patch } : c)) })),
      removeCheck: (cid) => set((s) => ({ checks: s.checks.filter((c) => c.id !== cid) })),
      toggleWish: (cid) => set((s) => ({ checks: s.checks.map((c) => (c.id === cid ? { ...c, wished: !c.wished } : c)) })),

      addWardrobe: (item) => set((s) => ({ wardrobe: [{ ...item, id: id() }, ...s.wardrobe] })),
      removeWardrobe: (wid) => set((s) => ({ wardrobe: s.wardrobe.filter((w) => w.id !== wid) })),

      addFolder: (name) => {
        const n = name.trim();
        if (!n || get().folders.some((f) => f.toLowerCase() === n.toLowerCase())) return false;
        set((s) => ({ folders: [...s.folders, n] }));
        return true;
      },
      saveLook: (look) => {
        const newId = id();
        set((s) => ({ looks: [{ ...look, id: newId, createdAt: Date.now() }, ...s.looks] }));
        return newId;
      },
      moveLook: (lid, folder) => set((s) => ({ looks: s.looks.map((l) => (l.id === lid ? { ...l, folder } : l)) })),
      removeLook: (lid) => set((s) => ({ looks: s.looks.filter((l) => l.id !== lid) })),

      addFit: (entry) => set((s) => ({ fitHistory: [{ ...entry, id: id(), createdAt: Date.now() }, ...s.fitHistory] })),
      setPriceAlerts: (priceAlerts) => set({ priceAlerts }),
      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'will-it-fit-me',
      storage: createJSONStorage(() => AsyncStorage),
      // Photos never reach disk: drop the selfie and any screenshots.
      partialize: ({ pendingSelfie: _selfie, checks, ...rest }) => ({
        ...rest,
        checks: checks.map(({ screenshot: _s, ...c }) => (c.status === 'pending' ? { ...c, status: 'error' as const, error: 'Interrupted — try again.' } : c)),
      }),
    },
  ),
);

/** What the server needs to judge fit. */
export function apiProfile(s: Pick<State, 'measurements' | 'notes' | 'fitPreference' | 'colorType' | 'fitHistory'>): ApiProfile {
  return {
    measurements: s.measurements,
    bodyShape: bodyShape(s.measurements),
    heightCategory: heightCategory(s.measurements.heightCm),
    notes: s.notes,
    fitPreference: s.fitPreference,
    colorType: s.colorType
      ? {
          season: s.colorType.season,
          undertone: s.colorType.undertone,
          contrast: s.colorType.contrast,
          best: s.colorType.best,
          avoid: s.colorType.avoid,
        }
      : undefined,
    fitHistory: s.fitHistory.slice(0, 30).map((f) => ({
      brand: f.brand,
      item: f.item,
      size: f.size,
      note: `${Object.entries(f.zones)
        .map(([z, v]) => `${z} ${v}`)
        .join(', ')}; ${f.kept ? 'kept' : 'returned'}${f.note ? `; ${f.note}` : ''}`,
    })),
  };
}
