import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResetService } from './reset.service.js';

@ApiTags('reset')
@Controller('reset')
export class ResetController {
  constructor(private readonly resetService: ResetService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset application state' })
  @ApiOkResponse({
    description: 'Application state reset successfully.',
    schema: {
      type: 'string',
      example: 'OK',
    },
  })
  async reset(): Promise<string> {
    await this.resetService.reset();

    return 'OK';
  }
}
