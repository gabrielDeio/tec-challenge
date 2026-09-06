import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Account } from '../accounts/account.entity.js';

export enum TransactionType {
  Deposit = 'deposit',
  Transfer = 'transfer',
  Withdraw = 'withdraw',
}

@Entity('transactions')
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'simple-enum', enum: TransactionType })
  type: TransactionType;

  @Column({ type: 'integer' })
  amount: number;

  @Column({ type: 'text', name: 'account_id_origin', nullable: true })
  accountIdOrigin: string | null;

  @ManyToOne(() => Account, (account) => account.originTransactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'account_id_origin' })
  accountOrigin: Account | null;

  @Column({ type: 'text', name: 'account_id_destiny', nullable: true })
  accountIdDestiny: string | null;

  @ManyToOne(() => Account, (account) => account.destinyTransactions, {
    nullable: true,
  })
  @JoinColumn({ name: 'account_id_destiny' })
  accountDestiny: Account | null;
}
