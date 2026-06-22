import { create } from "zustand";
import { getWallet } from "../services/api";

interface WalletState {
  balanceInCents: number | null;
  refresh: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balanceInCents: null,

  refresh: async () => {
    const wallet = await getWallet();
    set({ balanceInCents: wallet.balanceInCents });
  },
}));
