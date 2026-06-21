import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { WalletEntity } from '../../src/infrastructure/persistence/entities/wallet.entity';

const KEYCLOAK_TOKEN_URL = 'http://localhost:8080/realms/crash-game/protocol/openid-connect/token';

async function getAccessToken(username: string, password: string): Promise<string> {
  const response = await fetch(KEYCLOAK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'password',
      client_id: 'crash-game-client',
      username,
      password,
    }),
  });
  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

describe('Wallets (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    await app.get(MikroORM).getMigrator().up();

    token = await getAccessToken('player', 'player123');

    const em = app.get(MikroORM).em.fork();
    await em.nativeDelete(WalletEntity, {});
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a wallet and returns it with zero balance', async () => {
    const response = await request(app.getHttpServer())
      .post('/')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);

    expect(response.body.balanceInCents).toBe(0);
  });

  it('rejects creating a duplicate wallet for the same player', async () => {
    await request(app.getHttpServer()).post('/').set('Authorization', `Bearer ${token}`).expect(409);
  });

  it('returns the wallet via GET /me', async () => {
    const response = await request(app.getHttpServer())
      .get('/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.balanceInCents).toBe(0);
  });

  it('rejects requests without a token', async () => {
    await request(app.getHttpServer()).get('/me').expect(401);
  });
});
