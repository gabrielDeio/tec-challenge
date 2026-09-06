import { INestApplication } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { randomUUID } from 'node:crypto';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import request from 'supertest';
import { Repository } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it, test } from 'vitest';
import { Account } from '../accounts/account.entity.js';
import { AppModule } from '../app.module.js';
import { setupApp } from '../app.setup.js';
import {
  Transaction,
  TransactionType,
} from '../transactions/transaction.entity.js';

describe('EventsController withdraw', () => {
  let app: INestApplication;
  let accountRepository: Repository<Account>;
  let transactionRepository: Repository<Transaction>;
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
    transactionRepository = moduleRef.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
  });

  afterEach(async () => {
    await app.close();
    delete process.env.DATABASE_PATH;
    await rm(databasePath, { force: true });
  });

  it('subtracts from an existing origin account and records a transaction', async () => {
    await accountRepository.save({
      id: 'withdraw-account',
      balance: 100,
    });

    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'withdraw',
        origin: 'withdraw-account',
        amount: 30,
      })
      .expect(201);

    expect(response.body).toEqual({
      origin: {
        id: 'withdraw-account',
        balance: 70,
      },
    });

    const account = await accountRepository.findOneBy({
      id: 'withdraw-account',
    });
    const transactions = await transactionRepository.findBy({
      accountIdOrigin: 'withdraw-account',
    });

    expect(account).toMatchObject({
      id: 'withdraw-account',
      balance: 70,
    });
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      type: TransactionType.Withdraw,
      amount: 30,
      accountIdOrigin: 'withdraw-account',
      accountIdDestiny: null,
    });
  });

  it('rejects insufficient funds without mutating balance or recording a transaction', async () => {
    await accountRepository.save({
      id: 'insufficient-funds-account',
      balance: 20,
    });

    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'withdraw',
        origin: 'insufficient-funds-account',
        amount: 30,
      })
      .expect(422);

    expect(response.body).toMatchObject({
      statusCode: 422,
      error: 'Unprocessable Entity',
      message: 'Insufficient funds.',
    });

    const account = await accountRepository.findOneBy({
      id: 'insufficient-funds-account',
    });

    expect(account).toMatchObject({
      id: 'insufficient-funds-account',
      balance: 20,
    });
    expect(await transactionRepository.count()).toBe(0);
  });

  it('returns zero with not found when the origin account does not exist', async () => {
    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'withdraw',
        origin: 'missing-withdraw-account',
        amount: 10,
      })
      .expect(404);

    expect(response.body).toBe(0);
    expect(await accountRepository.count()).toBe(0);
    expect(await transactionRepository.count()).toBe(0);
  });

  it('rejects missing origin without creating transactions', async () => {
    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'withdraw',
        amount: 10,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'origin is required for withdraw events.',
    });
    expect(await accountRepository.count()).toBe(0);
    expect(await transactionRepository.count()).toBe(0);
  });

  test.each([0, -1])(
    'rejects invalid event amount %s without mutating an existing account',
    async (amount) => {
      await accountRepository.save({
        id: 'invalid-withdraw-account',
        balance: 50,
      });

      const response = await request(app.getHttpServer())
        .post('/event')
        .send({
          type: 'withdraw',
          origin: 'invalid-withdraw-account',
          amount,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
      });

      const account = await accountRepository.findOneBy({
        id: 'invalid-withdraw-account',
      });

      expect(account).toMatchObject({
        id: 'invalid-withdraw-account',
        balance: 50,
      });
      expect(await accountRepository.count()).toBe(1);
      expect(await transactionRepository.count()).toBe(0);
    },
  );
});
