import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TransactionType } from '../../transactions/transaction.entity.js';

export class CreateEventDto {
  @ApiProperty({
    enum: TransactionType,
    example: TransactionType.Deposit,
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    example: 100,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({
    example: '123',
  })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({
    example: '123',
  })
  @IsOptional()
  @IsString()
  destination?: string;
}
