import { Injectable } from '@nestjs/common';
import { AccountsRepository } from '../accounts/accounts.repository.js';

@Injectable()
export class BalanceService {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async getBalance(accountId: string): Promise<number> {
    const account = await this.accountsRepository.findById(accountId);

    return account?.balance ?? 0;
  }
}
