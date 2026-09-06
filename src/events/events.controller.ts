import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnprocessableEntityResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { CreateEventDto } from './dto/create-event.dto.js';
import {
  DepositEventDto,
  DepositEventResponseDto,
  TransferEventDto,
  TransferEventResponseDto,
  WithdrawEventDto,
  WithdrawEventResponseDto,
} from './dto/event-docs.dto.js';
import {
  AccountNotFoundError,
  EventResponse,
  EventsService,
} from './events.service.js';
import type { Response } from 'express';

@ApiTags('events')
@ApiExtraModels(
  DepositEventDto,
  WithdrawEventDto,
  TransferEventDto,
  DepositEventResponseDto,
  WithdrawEventResponseDto,
  TransferEventResponseDto,
)
@Controller('event')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Handle a financial event' })
  @ApiBody({
    schema: {
      oneOf: [
        { $ref: getSchemaPath(DepositEventDto) },
        { $ref: getSchemaPath(WithdrawEventDto) },
        { $ref: getSchemaPath(TransferEventDto) },
      ],
    },
    examples: {
      deposit: {
        summary: 'Deposit',
        value: {
          type: 'deposit',
          destination: '123',
          amount: 100,
        },
      },
      withdraw: {
        summary: 'Withdraw',
        value: {
          type: 'withdraw',
          origin: '123',
          amount: 50,
        },
      },
      transfer: {
        summary: 'Transfer',
        value: {
          type: 'transfer',
          origin: '123',
          destination: '456',
          amount: 25,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Event applied successfully.',
    schema: {
      oneOf: [
        { $ref: getSchemaPath(DepositEventResponseDto) },
        { $ref: getSchemaPath(WithdrawEventResponseDto) },
        { $ref: getSchemaPath(TransferEventResponseDto) },
      ],
    },
    examples: {
      deposit: {
        summary: 'Deposit response',
        value: {
          destination: {
            id: '123',
            balance: 100,
          },
        },
      },
      withdraw: {
        summary: 'Withdraw response',
        value: {
          origin: {
            id: '123',
            balance: 50,
          },
        },
      },
      transfer: {
        summary: 'Transfer response',
        value: {
          origin: {
            id: '123',
            balance: 75,
          },
          destination: {
            id: '456',
            balance: 25,
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid body, unsupported event type, or same origin and destination.',
    schema: {
      example: {
        message:
          'origin and destination must be different for transfer events.',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'Origin account does not exist. Response body is 0.',
    schema: { type: 'integer', example: 0 },
  })
  @ApiUnprocessableEntityResponse({
    description: 'Insufficient funds.',
    schema: {
      example: {
        message: 'Insufficient funds.',
        error: 'Unprocessable Entity',
        statusCode: 422,
      },
    },
  })
  async handleEvent(
    @Body() dto: CreateEventDto,
    @Res() response: Response,
  ): Promise<Response<EventResponse | number>> {
    try {
      const result = await this.eventsService.handleEvent(dto);

      return response.status(HttpStatus.CREATED).send(result);
    } catch (error) {
      if (error instanceof AccountNotFoundError) {
        return response.status(HttpStatus.NOT_FOUND).send(0);
      }

      throw error;
    }
  }
}
