import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity.js';

@Entity('accounts')
export class Account {
  @PrimaryColumn({ type: 'text' })
  id: string;

  @Column({ type: 'integer' })
  balance: number;

  @OneToMany(() => Transaction, (transaction) => transaction.accountOrigin)
  originTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.accountDestiny)
  destinyTransactions: Transaction[];
}
