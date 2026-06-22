import { describe, it, expect, beforeAll, afterAll, afterEach } from 'bun:test';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { GameLoopService } from '../../src/infrastructure/scheduling/game-loop.service';
import { CreateRoundUseCase } from '../../src/application/use-cases/create-round.use-case';
import { StartRoundUseCase } from '../../src/application/use-cases/start-round.use-case';
import { CrashRoundUseCase } from '../../src/application/use-cases/crash-round.use-case';
import { ROUND_REPOSITORY, type RoundRepository } from '../../src/domain/repositories/round.repository';
import { RoundPhase } from '../../src/domain/entities/round';
import { Bet, BetStatus } from '../../src/domain/entities/bet';

const KEYCLOAK_TOKEN_URL = 'http://localhost:8080/realms/crash-game/protocol/openid-connect/token';
const WALLETS_URL = 'http://localhost:4002';

async function getAccessToken(): Promise<string> {
  const response = await fetch(KEYCLOAK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'crash-game-client',
      username: 'player',
      password: 'player123',
    }),
  });
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

async function getWalletBalance(token: string): Promise<number> {
  const response = await fetch(`${WALLETS_URL}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await response.json()) as { balanceInCents: number };
  return data.balanceInCents;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Games (e2e)', () => {
  let app: INestApplication;
  let orm: MikroORM;
  let token: string;
  let createRound: CreateRoundUseCase;
  let startRound: StartRoundUseCase;
  let crashRound: CrashRoundUseCase;
  let roundRepository: RoundRepository;
  let roundsToClose: string[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GameLoopService)
      .useValue({ onApplicationBootstrap: () => {}, onApplicationShutdown: () => {} })
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    orm = app.get(MikroORM);
    await orm.getMigrator().up();

    createRound = app.get(CreateRoundUseCase);
    startRound = app.get(StartRoundUseCase);
    crashRound = app.get(CrashRoundUseCase);
    roundRepository = app.get(ROUND_REPOSITORY);

    token = await getAccessToken();
  });

  afterAll(async () => {
    await app.close();
  });

  async function inContext<T>(fn: () => Promise<T>): Promise<T> {
    return RequestContext.create(orm.em, fn);
  }

  async function openBettingRound(): Promise<string> {
    const round = await inContext(() => createRound.execute());
    roundsToClose.push(round.id);
    return round.id;
  }

  async function closeRound(roundId: string): Promise<void> {
    const round = await inContext(() => roundRepository.findById(roundId));
    if (!round || round.phase === RoundPhase.CRASHED) {
      return;
    }
    if (round.phase === RoundPhase.BETTING) {
      await inContext(() => startRound.execute(roundId, new Date()));
    }
    await inContext(() => crashRound.execute(roundId));
  }

  // Every round created in a test must end up CRASHED before the next test
  // runs, otherwise findCurrent() (used by the bet/cashout endpoints) could
  // pick up a leftover round instead of the one the next test just created.
  // Running this here too - not just at the end of each test - means a round
  // still gets closed even if an assertion throws partway through.
  afterEach(async () => {
    for (const roundId of roundsToClose) {
      await closeRound(roundId);
    }
    roundsToClose = [];
  });

  it('bets, the round runs, cashes out, and the wallet balance is updated', async () => {
    const roundId = await openBettingRound();
    const balanceBefore = await getWalletBalance(token);

    const placeBetResponse = await request(app.getHttpServer())
      .post('/bet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountInCents: 100 })
      .expect(201);
    expect(placeBetResponse.body.status).toBe('PENDING');
    expect(placeBetResponse.body.username).toBe('player');

    await sleep(1000);
    expect(await getWalletBalance(token)).toBe(balanceBefore - 100);

    const currentRoundResponse = await request(app.getHttpServer())
      .get('/rounds/current')
      .expect(200);
    const publicBet = (currentRoundResponse.body.bets as { roundId: string; username?: string }[]).find(
      (bet) => bet.roundId === roundId,
    );
    expect(publicBet?.username).toBe('player');

    await inContext(() => startRound.execute(roundId, new Date()));

    const cashOutResponse = await request(app.getHttpServer())
      .post('/bet/cashout')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(cashOutResponse.body.status).toBe('CASHED_OUT');

    const payoutInCents = cashOutResponse.body.payoutInCents as number;
    await sleep(1000);
    expect(await getWalletBalance(token)).toBe(balanceBefore - 100 + payoutInCents);
  });

  it('loses the bet when the round crashes before cashing out', async () => {
    const roundId = await openBettingRound();

    await request(app.getHttpServer())
      .post('/bet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountInCents: 100 })
      .expect(201);

    await sleep(1000);
    await closeRound(roundId);

    const myBets = await request(app.getHttpServer())
      .get('/bets/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const lostBet = (myBets.body as Bet[]).find((bet) => bet.roundId === roundId);
    expect(lostBet?.status).toBe(BetStatus.LOST);
  });

  it('rejects a second bet from the same player in the same round', async () => {
    await openBettingRound();

    await request(app.getHttpServer())
      .post('/bet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountInCents: 100 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/bet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountInCents: 100 })
      .expect(409);
  });

  it('rejects betting once the round has left the betting phase', async () => {
    const roundId = await openBettingRound();
    await inContext(() => startRound.execute(roundId, new Date()));

    await request(app.getHttpServer())
      .post('/bet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountInCents: 100 })
      .expect(409);
  });

  it('rejects an amount below the minimum bet', async () => {
    await openBettingRound();

    await request(app.getHttpServer())
      .post('/bet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountInCents: 1 })
      .expect(400);
  });

  it('rejects a bet that exceeds the wallet balance', async () => {
    const drainRoundId = await openBettingRound();
    const balance = await getWalletBalance(token);
    const drainAmount = Math.min(balance, Bet.MAX_AMOUNT_CENTS);

    await request(app.getHttpServer())
      .post('/bet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountInCents: drainAmount })
      .expect(201);

    await sleep(1000);
    await closeRound(drainRoundId);
    expect(await getWalletBalance(token)).toBe(0);

    const roundId = await openBettingRound();
    const placeBetResponse = await request(app.getHttpServer())
      .post('/bet')
      .set('Authorization', `Bearer ${token}`)
      .send({ amountInCents: 100 })
      .expect(201);
    expect(placeBetResponse.body.status).toBe('PENDING');

    await sleep(1000);

    const myBets = await request(app.getHttpServer())
      .get('/bets/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const rejectedBet = (myBets.body as Bet[]).find((bet) => bet.roundId === roundId);
    expect(rejectedBet?.status).toBe(BetStatus.REJECTED);
  });
});
