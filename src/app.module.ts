import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './accounts/account.entity.js';
import { AccountsModule } from './accounts/accounts.module.js';
import { BalanceModule } from './balance/balance.module.js';
import { EventsModule } from './events/events.module.js';
import { Transaction } from './transactions/transaction.entity.js';
import { TransactionsModule } from './transactions/transactions.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'db.sqlite',
      entities: [Account, Transaction],
      autoLoadEntities: true,
      synchronize: true,
    }),
    AccountsModule,
    BalanceModule,
    EventsModule,
    TransactionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
