import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
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

export type WithdrawEventResponse = {
  origin: AccountResponse;
};

export type EventResponse = DepositEventResponse | WithdrawEventResponse;

export class AccountNotFoundError extends Error {
  constructor() {
    super('Account not found.');
  }
}

@Injectable()
export class EventsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly accountsRepository: AccountsRepository,
    private readonly transactionsRepository: TransactionsRepository,
  ) {}

  handleEvent(dto: CreateEventDto): Promise<EventResponse> {
    if (dto.type === TransactionType.Deposit) {
      return this.handleDeposit(dto);
    }

    if (dto.type === TransactionType.Withdraw) {
      return this.handleWithdraw(dto);
    }

    throw new BadRequestException(
      'Only deposit and withdraw events are implemented.',
    );
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

  private handleWithdraw(dto: CreateEventDto): Promise<WithdrawEventResponse> {
    if (!dto.origin) {
      throw new BadRequestException('origin is required for withdraw events.');
    }

    const origin = dto.origin;

    return this.dataSource.transaction(async (manager) => {
      const account = await this.accountsRepository.findById(origin, manager);

      if (!account) {
        throw new AccountNotFoundError();
      }

      const debited = await this.accountsRepository.debitIfEnoughBalance(
        origin,
        dto.amount,
        manager,
      );

      if (!debited) {
        throw new UnprocessableEntityException('Insufficient funds.');
      }

      const updatedAccount = await this.accountsRepository.findById(
        origin,
        manager,
      );

      if (!updatedAccount) {
        throw new Error('Origin account could not be found.');
      }

      const transaction = this.transactionsRepository.create({
        type: TransactionType.Withdraw,
        amount: dto.amount,
        accountIdOrigin: updatedAccount.id,
        accountIdDestiny: null,
      });

      await this.transactionsRepository.save(transaction, manager);

      return {
        origin: {
          id: updatedAccount.id,
          balance: updatedAccount.balance,
        },
      };
    });
  }
}
