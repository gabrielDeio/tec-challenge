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

export type TransferEventResponse = {
  origin: AccountResponse;
  destination: AccountResponse;
};

export type EventResponse =
  DepositEventResponse | WithdrawEventResponse | TransferEventResponse;

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

    if (dto.type === TransactionType.Transfer) {
      return this.handleTransfer(dto);
    }

    throw new BadRequestException('Unsupported event type.');
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

  private handleTransfer(dto: CreateEventDto): Promise<TransferEventResponse> {
    if (!dto.origin) {
      throw new BadRequestException('origin is required for transfer events.');
    }

    if (!dto.destination) {
      throw new BadRequestException(
        'destination is required for transfer events.',
      );
    }

    const origin = dto.origin;
    const destination = dto.destination;

    if (origin === destination) {
      throw new BadRequestException(
        'origin and destination must be different for transfer events.',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const originAccount = await this.accountsRepository.findById(
        origin,
        manager,
      );

      if (!originAccount) {
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

      await this.accountsRepository.createIfNotExists(destination, 0, manager);
      await this.accountsRepository.incrementBalance(
        destination,
        dto.amount,
        manager,
      );

      const updatedOrigin = await this.accountsRepository.findById(
        origin,
        manager,
      );
      const updatedDestination = await this.accountsRepository.findById(
        destination,
        manager,
      );

      if (!updatedOrigin || !updatedDestination) {
        throw new Error('Transfer accounts could not be found.');
      }

      const transaction = this.transactionsRepository.create({
        type: TransactionType.Transfer,
        amount: dto.amount,
        accountIdOrigin: updatedOrigin.id,
        accountIdDestiny: updatedDestination.id,
      });

      await this.transactionsRepository.save(transaction, manager);

      return {
        origin: {
          id: updatedOrigin.id,
          balance: updatedOrigin.balance,
        },
        destination: {
          id: updatedDestination.id,
          balance: updatedDestination.balance,
        },
      };
    });
  }
}
