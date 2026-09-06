import { ApiProperty } from '@nestjs/swagger';
import { TransactionType } from '../../transactions/transaction.entity.js';

class AccountEventResponseDto {
  @ApiProperty({ example: '123' })
  id: string;

  @ApiProperty({ example: 100 })
  balance: number;
}

export class DepositEventDto {
  @ApiProperty({
    enum: [TransactionType.Deposit],
    example: TransactionType.Deposit,
  })
  type: TransactionType.Deposit;

  @ApiProperty({ example: '123' })
  destination: string;

  @ApiProperty({ example: 100, minimum: 1 })
  amount: number;
}

export class WithdrawEventDto {
  @ApiProperty({
    enum: [TransactionType.Withdraw],
    example: TransactionType.Withdraw,
  })
  type: TransactionType.Withdraw;

  @ApiProperty({ example: '123' })
  origin: string;

  @ApiProperty({ example: 50, minimum: 1 })
  amount: number;
}

export class TransferEventDto {
  @ApiProperty({
    enum: [TransactionType.Transfer],
    example: TransactionType.Transfer,
  })
  type: TransactionType.Transfer;

  @ApiProperty({ example: '123' })
  origin: string;

  @ApiProperty({ example: '456' })
  destination: string;

  @ApiProperty({ example: 25, minimum: 1 })
  amount: number;
}

export class DepositEventResponseDto {
  @ApiProperty({ type: AccountEventResponseDto })
  destination: AccountEventResponseDto;
}

export class WithdrawEventResponseDto {
  @ApiProperty({ type: AccountEventResponseDto })
  origin: AccountEventResponseDto;
}

export class TransferEventResponseDto {
  @ApiProperty({ type: AccountEventResponseDto })
  origin: AccountEventResponseDto;

  @ApiProperty({ type: AccountEventResponseDto })
  destination: AccountEventResponseDto;
}
