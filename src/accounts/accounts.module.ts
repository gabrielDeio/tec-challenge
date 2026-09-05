import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from './account.entity.js';
import { AccountsRepository } from './accounts.repository.js';

@Module({
  imports: [TypeOrmModule.forFeature([Account])],
  providers: [AccountsRepository],
  exports: [AccountsRepository],
})
export class AccountsModule {}
