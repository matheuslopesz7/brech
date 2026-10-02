import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

/**
 * Simulação local (sem backend) do fluxo de reserva de peça única:
 * checkout → peça reservada por 24h → admin confirma (vendida) ou expira e volta à vitrine.
 */
export const RESERVATION_MS = 24 * 60 * 60 * 1000;

export type ReservationStatus = "reservada" | "vendida";
export interface Reservation {
  productId: string;
  title: string;
  image?: string;
  price: string;
  status: ReservationStatus;
  createdAt: number;
  expiresAt: number;
  orderId: string;
}

interface ReservationStore {
  reservations: Record<string, Reservation>;
  reserve: (items: Omit<Reservation, "status" | "createdAt" | "expiresAt" | "orderId">[]) => { ok: boolean; blocked: string[] };
  confirm: (productId: string) => void;
  release: (productId: string) => void;
  purgeExpired: () => void;
  isUnavailable: (productId: string) => ReservationStatus | null;
}

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set, get) => ({
      reservations: {},
      purgeExpired: () => {
        const now = Date.now();
        const next = { ...get().reservations };
        let changed = false;
        for (const [id, r] of Object.entries(next)) {
          if (r.status === "reservada" && r.expiresAt <= now) {
            delete next[id];
            changed = true;
          }
        }
        if (changed) set({ reservations: next });
      },
      isUnavailable: (productId) => {
        const r = get().reservations[productId];
        if (!r) return null;
        if (r.status === "reservada" && r.expiresAt <= Date.now()) return null;
        return r.status;
      },
      reserve: (items) => {
        get().purgeExpired();
        const blocked = items.filter((i) => get().isUnavailable(i.productId)).map((i) => i.title);
        if (blocked.length) return { ok: false, blocked };
        const now = Date.now();
        const orderId = `WOP-${now.toString(36).toUpperCase()}`;
        const next = { ...get().reservations };
        for (const i of items) {
          next[i.productId] = { ...i, status: "reservada", createdAt: now, expiresAt: now + RESERVATION_MS, orderId };
        }
        set({ reservations: next });
        return { ok: true, blocked: [] };
      },
      confirm: (productId) => {
        const r = get().reservations[productId];
        if (!r) return;
        set({ reservations: { ...get().reservations, [productId]: { ...r, status: "vendida" } } });
      },
      release: (productId) => {
        const next = { ...get().reservations };
        delete next[productId];
        set({ reservations: next });
      },
    }),
    { name: "wop-reservations", storage: createJSONStorage(() => localStorage) },
  ),
);
