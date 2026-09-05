import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module.js';
import { BalanceController } from './balance.controller.js';
import { BalanceService } from './balance.service.js';

@Module({
  imports: [AccountsModule],
  controllers: [BalanceController],
  providers: [BalanceService],
})
export class BalanceModule {}
