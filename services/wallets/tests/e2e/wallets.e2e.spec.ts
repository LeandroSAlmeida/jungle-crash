import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Wallets (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    await app.get(MikroORM).getMigrator().up();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a wallet and returns it with zero balance', async () => {
    const playerId = `player-${Date.now()}-1`;

    const response = await request(app.getHttpServer())
      .post('/')
      .set('x-player-id', playerId)
      .expect(201);

    expect(response.body.playerId).toBe(playerId);
    expect(response.body.balanceInCents).toBe(0);
  });

  it('rejects creating a duplicate wallet for the same player', async () => {
    const playerId = `player-${Date.now()}-2`;
    await request(app.getHttpServer()).post('/').set('x-player-id', playerId).expect(201);

    await request(app.getHttpServer()).post('/').set('x-player-id', playerId).expect(409);
  });

  it('returns the wallet via GET /me', async () => {
    const playerId = `player-${Date.now()}-3`;
    await request(app.getHttpServer()).post('/').set('x-player-id', playerId).expect(201);

    const response = await request(app.getHttpServer())
      .get('/me')
      .set('x-player-id', playerId)
      .expect(200);

    expect(response.body.playerId).toBe(playerId);
  });

  it('returns 404 when the player has no wallet', async () => {
    await request(app.getHttpServer())
      .get('/me')
      .set('x-player-id', `player-${Date.now()}-missing`)
      .expect(404);
  });
});
