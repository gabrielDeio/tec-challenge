import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './account.entity.js';

@Injectable()
export class AccountsRepository {
  constructor(
    @InjectRepository(Account)
    private readonly repository: Repository<Account>,
  ) {}

  create(balance: number): Account {
    return this.repository.create({ balance });
  }

  save(account: Account): Promise<Account> {
    return this.repository.save(account);
  }

  findAll(): Promise<Account[]> {
    return this.repository.find();
  }

  findById(id: string): Promise<Account | null> {
    return this.repository.findOneBy({ id });
  }
}
