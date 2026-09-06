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

describe('EventsController deposit', () => {
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

  it('creates a missing destination account, updates its balance, and records a transaction', async () => {
    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'deposit',
        destination: 'deposit-account',
        amount: 100,
      })
      .expect(201);

    expect(response.body).toEqual({
      destination: {
        id: 'deposit-account',
        balance: 100,
      },
    });

    const account = await accountRepository.findOneBy({
      id: 'deposit-account',
    });
    const transactions = await transactionRepository.findBy({
      accountIdDestiny: 'deposit-account',
    });

    expect(account).toMatchObject({
      id: 'deposit-account',
      balance: 100,
    });
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      type: TransactionType.Deposit,
      amount: 100,
      accountIdOrigin: null,
      accountIdDestiny: 'deposit-account',
    });
  });

  it('increments an existing destination account and records a transaction', async () => {
    await accountRepository.save({
      id: 'existing-deposit-account',
      balance: 50,
    });

    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'deposit',
        destination: 'existing-deposit-account',
        amount: 75,
      })
      .expect(201);

    expect(response.body).toEqual({
      destination: {
        id: 'existing-deposit-account',
        balance: 125,
      },
    });

    const account = await accountRepository.findOneBy({
      id: 'existing-deposit-account',
    });
    const transactions = await transactionRepository.findBy({
      accountIdDestiny: 'existing-deposit-account',
    });

    expect(account).toMatchObject({
      id: 'existing-deposit-account',
      balance: 125,
    });
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      type: TransactionType.Deposit,
      amount: 75,
      accountIdOrigin: null,
      accountIdDestiny: 'existing-deposit-account',
    });
  });

  it('rejects missing destination without creating accounts or transactions', async () => {
    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'deposit',
        amount: 100,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'destination is required for deposit events.',
    });
    expect(await accountRepository.count()).toBe(0);
    expect(await transactionRepository.count()).toBe(0);
  });

  test.each([0, -1])(
    'rejects invalid event amount %s without mutating an existing account',
    async (amount) => {
      await accountRepository.save({
        id: 'invalid-deposit-account',
        balance: 50,
      });

      const response = await request(app.getHttpServer())
        .post('/event')
        .send({
          type: 'deposit',
          destination: 'invalid-deposit-account',
          amount,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
      });

      const account = await accountRepository.findOneBy({
        id: 'invalid-deposit-account',
      });

      expect(account).toMatchObject({
        id: 'invalid-deposit-account',
        balance: 50,
      });
      expect(await accountRepository.count()).toBe(1);
      expect(await transactionRepository.count()).toBe(0);
    },
  );

  it('rejects invalid event amount without creating a missing account', async () => {
    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'deposit',
        destination: 'invalid-deposit-account',
        amount: 0,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
    });
    expect(await accountRepository.count()).toBe(0);
    expect(await transactionRepository.count()).toBe(0);
  });
});
