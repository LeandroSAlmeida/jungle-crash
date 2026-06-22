import { describe, it, expect } from "bun:test";
import { toLiveBet } from "../../src/hooks/useGameState";
import type { BetResponseDto } from "../../src/services/api";

function makeBet(overrides: Partial<BetResponseDto> = {}): BetResponseDto {
  return {
    id: "bet-1",
    roundId: "round-1",
    playerId: "player-1",
    username: "player",
    amountInCents: 1000,
    status: "PENDING",
    ...overrides,
  };
}

describe("toLiveBet", () => {
  it("maps a pending bet as-is", () => {
    const liveBet = toLiveBet(makeBet());
    expect(liveBet.status).toBe("PENDING");
    expect(liveBet.username).toBe("player");
    expect(liveBet.amountInCents).toBe(1000);
  });

  it("treats a rejected bet as lost for display purposes", () => {
    const liveBet = toLiveBet(makeBet({ status: "REJECTED" }));
    expect(liveBet.status).toBe("LOST");
  });

  it("falls back to anon when the username is missing", () => {
    const liveBet = toLiveBet(makeBet({ username: undefined }));
    expect(liveBet.username).toBe("anon");
  });

  it("carries over cashout details for a cashed out bet", () => {
    const liveBet = toLiveBet(makeBet({ status: "CASHED_OUT", cashoutMultiplier: 2.5, payoutInCents: 2500 }));
    expect(liveBet.status).toBe("CASHED_OUT");
    expect(liveBet.cashoutMultiplier).toBe(2.5);
    expect(liveBet.payoutInCents).toBe(2500);
  });
});
