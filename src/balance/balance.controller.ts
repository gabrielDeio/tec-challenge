import {
  BadRequestException,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { BalanceService } from './balance.service.js';

@ApiTags('balance')
@Controller('balance')
export class BalanceController {
  constructor(private readonly balanceService: BalanceService) {}

  @Get()
  @ApiOperation({ summary: 'Get account balance' })
  @ApiQuery({
    name: 'account_id',
    required: true,
    type: String,
    example: '123',
  })
  @ApiOkResponse({
    description: 'The account balance.',
    schema: { type: 'integer', example: 100 },
  })
  @ApiNotFoundResponse({
    description: 'The account does not exist. Response body is 0.',
    schema: { type: 'integer', example: 0 },
  })
  @ApiBadRequestResponse({
    description: '`account_id` query parameter is required.',
  })
  @HttpCode(HttpStatus.OK)
  async getBalance(
    @Query('account_id') accountId: string | undefined,
    @Res() response: Response,
  ): Promise<Response<number>> {
    if (!accountId) {
      throw new BadRequestException('account_id query parameter is required.');
    }

    const result = await this.balanceService.getBalance(accountId);

    return response
      .status(result.found ? HttpStatus.OK : HttpStatus.NOT_FOUND)
      .send(result.balance);
  }
}
