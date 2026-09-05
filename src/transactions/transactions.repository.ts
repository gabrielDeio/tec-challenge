import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

  save(transaction: Transaction): Promise<Transaction> {
    return this.repository.save(transaction);
  }

  findAll(): Promise<Transaction[]> {
    return this.repository.find();
  }

  findById(id: string): Promise<Transaction | null> {
    return this.repository.findOneBy({ id });
  }

  findByOriginAccountId(accountId: string): Promise<Transaction[]> {
    return this.repository.findBy({ accountIdOrigin: accountId });
  }

  findByDestinyAccountId(accountId: string): Promise<Transaction[]> {
    return this.repository.findBy({ accountIdDestiny: accountId });
  }
}
