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

describe('EventsController transfer', () => {
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

  it('moves funds between existing accounts and records a transaction', async () => {
    await accountRepository.save([
      {
        id: 'transfer-origin-account',
        balance: 100,
      },
      {
        id: 'transfer-destination-account',
        balance: 25,
      },
    ]);

    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'transfer',
        origin: 'transfer-origin-account',
        destination: 'transfer-destination-account',
        amount: 40,
      })
      .expect(201);

    expect(response.body).toEqual({
      origin: {
        id: 'transfer-origin-account',
        balance: 60,
      },
      destination: {
        id: 'transfer-destination-account',
        balance: 65,
      },
    });

    const origin = await accountRepository.findOneBy({
      id: 'transfer-origin-account',
    });
    const destination = await accountRepository.findOneBy({
      id: 'transfer-destination-account',
    });
    const transactions = await transactionRepository.findBy({
      accountIdOrigin: 'transfer-origin-account',
      accountIdDestiny: 'transfer-destination-account',
    });

    expect(origin).toMatchObject({
      id: 'transfer-origin-account',
      balance: 60,
    });
    expect(destination).toMatchObject({
      id: 'transfer-destination-account',
      balance: 65,
    });
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      type: TransactionType.Transfer,
      amount: 40,
      accountIdOrigin: 'transfer-origin-account',
      accountIdDestiny: 'transfer-destination-account',
    });
  });

  it('creates the destination account after debiting the origin account', async () => {
    await accountRepository.save({
      id: 'origin-with-new-destination',
      balance: 100,
    });

    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'transfer',
        origin: 'origin-with-new-destination',
        destination: 'new-transfer-destination',
        amount: 35,
      })
      .expect(201);

    expect(response.body).toEqual({
      origin: {
        id: 'origin-with-new-destination',
        balance: 65,
      },
      destination: {
        id: 'new-transfer-destination',
        balance: 35,
      },
    });

    const origin = await accountRepository.findOneBy({
      id: 'origin-with-new-destination',
    });
    const destination = await accountRepository.findOneBy({
      id: 'new-transfer-destination',
    });
    const transactions = await transactionRepository.findBy({
      accountIdOrigin: 'origin-with-new-destination',
      accountIdDestiny: 'new-transfer-destination',
    });

    expect(origin).toMatchObject({
      id: 'origin-with-new-destination',
      balance: 65,
    });
    expect(destination).toMatchObject({
      id: 'new-transfer-destination',
      balance: 35,
    });
    expect(transactions).toHaveLength(1);
    expect(transactions[0]).toMatchObject({
      type: TransactionType.Transfer,
      amount: 35,
      accountIdOrigin: 'origin-with-new-destination',
      accountIdDestiny: 'new-transfer-destination',
    });
  });

  it('rejects insufficient funds without mutating accounts or recording a transaction', async () => {
    await accountRepository.save({
      id: 'insufficient-transfer-origin',
      balance: 20,
    });

    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'transfer',
        origin: 'insufficient-transfer-origin',
        destination: 'uncreated-transfer-destination',
        amount: 30,
      })
      .expect(422);

    expect(response.body).toMatchObject({
      statusCode: 422,
      error: 'Unprocessable Entity',
      message: 'Insufficient funds.',
    });

    const origin = await accountRepository.findOneBy({
      id: 'insufficient-transfer-origin',
    });
    const destination = await accountRepository.findOneBy({
      id: 'uncreated-transfer-destination',
    });

    expect(origin).toMatchObject({
      id: 'insufficient-transfer-origin',
      balance: 20,
    });
    expect(destination).toBeNull();
    expect(await transactionRepository.count()).toBe(0);
  });

  it('returns zero with not found when the origin account does not exist', async () => {
    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'transfer',
        origin: 'missing-transfer-origin',
        destination: 'missing-origin-destination',
        amount: 10,
      })
      .expect(404);

    expect(response.body).toBe(0);
    expect(await accountRepository.count()).toBe(0);
    expect(await transactionRepository.count()).toBe(0);
  });

  it('rejects missing origin without creating accounts or transactions', async () => {
    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'transfer',
        destination: 'transfer-destination-without-origin',
        amount: 10,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'origin is required for transfer events.',
    });
    expect(await accountRepository.count()).toBe(0);
    expect(await transactionRepository.count()).toBe(0);
  });

  it('rejects missing destination without mutating the origin account', async () => {
    await accountRepository.save({
      id: 'transfer-origin-without-destination',
      balance: 50,
    });

    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'transfer',
        origin: 'transfer-origin-without-destination',
        amount: 10,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'destination is required for transfer events.',
    });

    const origin = await accountRepository.findOneBy({
      id: 'transfer-origin-without-destination',
    });

    expect(origin).toMatchObject({
      id: 'transfer-origin-without-destination',
      balance: 50,
    });
    expect(await accountRepository.count()).toBe(1);
    expect(await transactionRepository.count()).toBe(0);
  });

  it('rejects same origin and destination without mutating balance or recording a transaction', async () => {
    await accountRepository.save({
      id: 'same-transfer-account',
      balance: 80,
    });

    const response = await request(app.getHttpServer())
      .post('/event')
      .send({
        type: 'transfer',
        origin: 'same-transfer-account',
        destination: 'same-transfer-account',
        amount: 20,
      })
      .expect(400);

    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'origin and destination must be different for transfer events.',
    });

    const account = await accountRepository.findOneBy({
      id: 'same-transfer-account',
    });

    expect(account).toMatchObject({
      id: 'same-transfer-account',
      balance: 80,
    });
    expect(await accountRepository.count()).toBe(1);
    expect(await transactionRepository.count()).toBe(0);
  });

  test.each([0, -1])(
    'rejects invalid event amount %s without mutating existing accounts',
    async (amount) => {
      await accountRepository.save([
        {
          id: 'invalid-transfer-origin',
          balance: 100,
        },
        {
          id: 'invalid-transfer-destination',
          balance: 25,
        },
      ]);

      const response = await request(app.getHttpServer())
        .post('/event')
        .send({
          type: 'transfer',
          origin: 'invalid-transfer-origin',
          destination: 'invalid-transfer-destination',
          amount,
        })
        .expect(400);

      expect(response.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
      });

      const origin = await accountRepository.findOneBy({
        id: 'invalid-transfer-origin',
      });
      const destination = await accountRepository.findOneBy({
        id: 'invalid-transfer-destination',
      });

      expect(origin).toMatchObject({
        id: 'invalid-transfer-origin',
        balance: 100,
      });
      expect(destination).toMatchObject({
        id: 'invalid-transfer-destination',
        balance: 25,
      });
      expect(await accountRepository.count()).toBe(2);
      expect(await transactionRepository.count()).toBe(0);
    },
  );
});
