import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Account } from './account.entity.js';

@Injectable()
export class AccountsRepository {
  constructor(
    @InjectRepository(Account)
    private readonly repository: Repository<Account>,
  ) {}

  create(balance: number, id?: string): Account {
    return this.repository.create({ id, balance });
  }

  save(account: Account, manager?: EntityManager): Promise<Account> {
    return this.getRepository(manager).save(account);
  }

  findAll(manager?: EntityManager): Promise<Account[]> {
    return this.getRepository(manager).find();
  }

  findById(id: string, manager?: EntityManager): Promise<Account | null> {
    return this.getRepository(manager).findOneBy({ id });
  }

  async createIfNotExists(
    id: string,
    balance: number,
    manager?: EntityManager,
  ): Promise<Account> {
    const repository = this.getRepository(manager);

    await repository
      .createQueryBuilder()
      .insert()
      .into(Account)
      .values({ id, balance })
      .orIgnore()
      .execute();

    const account = await repository.findOneBy({ id });

    if (!account) {
      throw new Error('Account could not be created.');
    }

    return account;
  }

  async incrementBalance(
    accountId: string,
    amount: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await this.getRepository(manager)
      .createQueryBuilder()
      .update(Account)
      .set({ balance: () => 'balance + :amount' })
      .where('id = :accountId', { accountId })
      .setParameters({ amount })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  async debitIfEnoughBalance(
    accountId: string,
    amount: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const result = await this.getRepository(manager)
      .createQueryBuilder()
      .update(Account)
      .set({ balance: () => 'balance - :amount' })
      .where('id = :accountId', { accountId })
      .andWhere('balance >= :amount', { amount })
      .setParameters({ amount })
      .execute();

    return (result.affected ?? 0) > 0;
  }

  private getRepository(manager?: EntityManager): Repository<Account> {
    return manager?.getRepository(Account) ?? this.repository;
  }
}
