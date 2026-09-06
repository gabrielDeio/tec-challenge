import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CreateEventDto } from './dto/create-event.dto.js';
import { DepositEventResponse, EventsService } from './events.service.js';

@ApiTags('events')
@Controller('event')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @ApiOperation({ summary: 'Handle a financial event' })
  @ApiBody({
    type: CreateEventDto,
    examples: {
      deposit: {
        summary: 'Deposit',
        value: {
          type: 'deposit',
          destination: '123',
          amount: 100,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Deposit applied successfully.',
    schema: {
      example: {
        destination: {
          id: '123',
          balance: 100,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Invalid body or unsupported event type.',
  })
  handleEvent(@Body() dto: CreateEventDto): Promise<DepositEventResponse> {
    return this.eventsService.handleEvent(dto);
  }
}
