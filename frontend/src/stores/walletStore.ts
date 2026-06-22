import { create } from "zustand";
import { toast } from "sonner";
import { ApiError, createWallet, getWallet } from "../services/api";

interface WalletState {
  balanceInCents: number | null;
  refresh: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  balanceInCents: null,

  refresh: async () => {
    try {
      const wallet = await getWallet();
      set({ balanceInCents: wallet.balanceInCents });
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const wallet = await createWallet();
        set({ balanceInCents: wallet.balanceInCents });
        return;
      }
      toast.error("Não foi possível carregar seu saldo. Verifique sua conexão.");
    }
  },
}));
