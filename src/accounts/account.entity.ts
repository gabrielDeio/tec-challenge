import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Transaction } from '../transactions/transaction.entity.js';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'integer' })
  balance: number;

  @OneToMany(() => Transaction, (transaction) => transaction.accountOrigin)
  originTransactions: Transaction[];

  @OneToMany(() => Transaction, (transaction) => transaction.accountDestiny)
  destinyTransactions: Transaction[];
}
