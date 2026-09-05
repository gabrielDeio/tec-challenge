import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module.js';
import { TransactionsModule } from '../transactions/transactions.module.js';
import { EventsController } from './events.controller.js';
import { EventsService } from './events.service.js';

@Module({
  imports: [AccountsModule, TransactionsModule],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
