import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AccountsRepository } from '../accounts/accounts.repository.js';
import { TransactionType } from '../transactions/transaction.entity.js';
import { TransactionsRepository } from '../transactions/transactions.repository.js';
import { CreateEventDto } from './dto/create-event.dto.js';

type AccountResponse = {
  id: string;
  balance: number;
};

export type DepositEventResponse = {
  destination: AccountResponse;
};

@Injectable()
export class EventsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly accountsRepository: AccountsRepository,
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  handleEvent(dto: CreateEventDto): Promise<DepositEventResponse> {
    if (dto.type !== TransactionType.Deposit) {
      throw new BadRequestException('Only deposit events are implemented.');
    }

    return this.handleDeposit(dto);
  }

  private handleDeposit(dto: CreateEventDto): Promise<DepositEventResponse> {
    if (!dto.destination) {
      throw new BadRequestException(
        'destination is required for deposit events.',
      );
    }

    const destination = dto.destination;

    return this.dataSource.transaction(async (manager) => {
      await this.accountsRepository.createIfNotExists(destination, 0, manager);
      await this.accountsRepository.incrementBalance(
        destination,
        dto.amount,
        manager,
      );

      const account = await this.accountsRepository.findById(
        destination,
        manager,
      );

      if (!account) {
        throw new Error('Destination account could not be found.');
      }

      const transaction = this.transactionsRepository.create({
        type: TransactionType.Deposit,
        amount: dto.amount,
        accountIdOrigin: null,
        accountIdDestiny: account.id,
      });

      await this.transactionsRepository.save(transaction, manager);

      return {
        destination: {
          id: account.id,
          balance: account.balance,
        },
      };
    });
  }
}
