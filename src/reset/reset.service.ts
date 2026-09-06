import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccountsRepository } from '../accounts/accounts.repository.js';
import { TransactionsRepository } from '../transactions/transactions.repository.js';

@Injectable()
export class ResetService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly accountsRepository: AccountsRepository,
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  async reset(): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.transactionsRepository.clear(manager);
      await this.accountsRepository.clear(manager);
    });
  }
}
