import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Transaction } from './transaction.entity.js';
import { TransactionsRepository } from './transactions.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Transaction])],
  providers: [TransactionsRepository],
  exports: [TransactionsRepository],
})
export class TransactionsModule {}
