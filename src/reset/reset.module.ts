import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { ResetController } from './reset.controller.js';
import { ResetService } from './reset.service.js';

@Module({
  imports: [AccountsModule, TransactionsModule],
  controllers: [ResetController],
  providers: [ResetService],
})
export class ResetModule {}
