import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './accounts/account.entity.js';
import { AccountsModule } from './accounts/accounts.module.js';
import { Transaction } from './transactions/transaction.entity.js';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
