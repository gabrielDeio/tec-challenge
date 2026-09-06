import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppModule } from '../app.module.js';
import { setupApp } from '../app.setup.js';
import { Account } from '../accounts/account.entity.js';

describe('BalanceController', () => {
  let app: INestApplication;
  let accountRepository: Repository<Account>;
  let databasePath: string;

  beforeEach(async () => {
    databasePath = join('/tmp', `tec-challenge-${randomUUID()}.sqlite`);
    process.env.DATABASE_PATH = databasePath;

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();

    accountRepository = moduleRef.get<Repository<Account>>(
      getRepositoryToken(Account),
    );
  });

  afterEach(async () => {
    await app.close();
    delete process.env.DATABASE_PATH;
    await rm(databasePath, { force: true });
  });

  it('returns the persisted balance for an existing account', async () => {
    await accountRepository.save({
      id: 'existing-account',
      balance: 100,
    });

    const response = await request(app.getHttpServer())
      .get('/balance')
      .query({ account_id: 'existing-account' })
      .expect(200);

    expect(response.body).toBe(100);

    const account = await accountRepository.findOneBy({
      id: 'existing-account',
    });

    expect(account).toMatchObject({
      id: 'existing-account',
      balance: 100,
    });
  });

  it('returns 404 with body 0 when the account does not exist', async () => {
    const response = await request(app.getHttpServer())
      .get('/balance')
      .query({ account_id: 'missing-account' })
      .expect(404);

    expect(response.body).toBe(0);

    const account = await accountRepository.findOneBy({
      id: 'missing-account',
    });

    expect(account).toBeNull();
  });

  it('returns 400 when account_id is missing', async () => {
    const response = await request(app.getHttpServer())
      .get('/balance')
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'account_id query parameter is required.',
    });
  });
});
