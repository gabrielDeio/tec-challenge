import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Transaction } from './transaction.entity.js';

type CreateTransactionData = Pick<
  Transaction,
  'type' | 'amount' | 'accountIdOrigin' | 'accountIdDestiny'
>;

@Injectable()
export class TransactionsRepository {
  constructor(
    @InjectRepository(Transaction)
    private readonly repository: Repository<Transaction>,
  ) {}

  create(data: CreateTransactionData): Transaction {
    return this.repository.create(data);
  }

  save(
    transaction: Transaction,
    manager?: EntityManager,
  ): Promise<Transaction> {
    return this.getRepository(manager).save(transaction);
  }

  findAll(manager?: EntityManager): Promise<Transaction[]> {
    return this.getRepository(manager).find();
  }

  findById(id: string, manager?: EntityManager): Promise<Transaction | null> {
    return this.getRepository(manager).findOneBy({ id });
  }

  findByOriginAccountId(
    accountId: string,
    manager?: EntityManager,
  ): Promise<Transaction[]> {
    return this.getRepository(manager).findBy({ accountIdOrigin: accountId });
  }

  findByDestinyAccountId(
    accountId: string,
    manager?: EntityManager,
  ): Promise<Transaction[]> {
    return this.getRepository(manager).findBy({ accountIdDestiny: accountId });
  }

  private getRepository(manager?: EntityManager): Repository<Transaction> {
    return manager?.getRepository(Transaction) ?? this.repository;
  }
}
