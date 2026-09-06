import { Injectable } from '@nestjs/common';
import { AccountsRepository } from '../accounts/accounts.repository.js';

export type BalanceResult = {
  balance: number;
  found: boolean;
};

@Injectable()
export class BalanceService {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  async getBalance(accountId: string): Promise<BalanceResult> {
    const account = await this.accountsRepository.findById(accountId);

    return {
      balance: account?.balance ?? 0,
      found: Boolean(account),
    };
  }
}
