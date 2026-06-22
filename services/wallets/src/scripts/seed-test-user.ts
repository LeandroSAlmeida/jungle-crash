import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MikroORM, RequestContext } from '@mikro-orm/core';
import { AppModule } from '../app.module';
import { CreateWalletUseCase } from '../application/use-cases/create-wallet.use-case';
import { CreditWalletUseCase } from '../application/use-cases/credit-wallet.use-case';
import { GetWalletUseCase } from '../application/use-cases/get-wallet.use-case';
import { WalletNotFoundError } from '../domain/errors/wallet-not-found.error';

const SEED_BALANCE_CENTS = Number(process.env.SEED_PLAYER_BALANCE_CENTS ?? 100000);
const KEYCLOAK_INTERNAL_ISSUER = process.env.KEYCLOAK_INTERNAL_ISSUER ?? process.env.KEYCLOAK_ISSUER ?? '';
const TOKEN_URL = `${KEYCLOAK_INTERNAL_ISSUER}/protocol/openid-connect/token`;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeSub(accessToken: string): string {
  const payload = accessToken.split('.')[1];
  const decoded = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
  return decoded.sub;
}

async function fetchTestUserSub(): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'crash-game-client',
      username: 'player',
      password: 'player123',
    }),
  });

  if (!response.ok) {
    throw new Error(`Keycloak token request failed: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as { access_token: string };
  return decodeSub(data.access_token);
}

async function fetchTestUserSubWithRetry(attempts = 5, delayMs = 2000): Promise<string> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetchTestUserSub();
    } catch (error) {
      lastError = error;
      console.log(`Keycloak not ready yet (attempt ${attempt}/${attempts}): ${error}`);
      await sleep(delayMs);
    }
  }
  throw lastError;
}

async function main(): Promise<void> {
  const playerId = await fetchTestUserSubWithRetry();

  const app = await NestFactory.create(AppModule);
  await app.listen(0);
  const orm = app.get(MikroORM);

  await RequestContext.create(orm.em, async () => {
    const getWallet = app.get(GetWalletUseCase);

    const createWallet = app.get(CreateWalletUseCase);
    const creditWallet = app.get(CreditWalletUseCase);

    try {
      const wallet = await getWallet.execute(playerId);
      if (wallet.balance.cents >= SEED_BALANCE_CENTS) {
        console.log(`Test user wallet already has ${wallet.balance.cents} cents - skipping seed.`);
        return;
      }
      const topUp = SEED_BALANCE_CENTS - wallet.balance.cents;
      await creditWallet.execute(playerId, topUp);
      console.log(`Topped up test user wallet by ${topUp} cents (now at ${SEED_BALANCE_CENTS} cents).`);
      return;
    } catch (error) {
      if (!(error instanceof WalletNotFoundError)) {
        throw error;
      }
    }

    await createWallet.execute(playerId);
    await creditWallet.execute(playerId, SEED_BALANCE_CENTS);
    console.log(`Seeded test user wallet (player ${playerId}) with ${SEED_BALANCE_CENTS} cents.`);
  });

  await app.close();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed script failed:', error);
    process.exit(1);
  });
