import { useCallback, useEffect, useState } from "react";
import { getWallet } from "../services/api";

export function useWallet() {
  const [balanceInCents, setBalanceInCents] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const wallet = await getWallet();
    setBalanceInCents(wallet.balanceInCents);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balanceInCents, refresh };
}
