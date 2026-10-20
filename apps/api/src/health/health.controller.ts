import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        ok: { type: 'boolean' },
        app: { type: 'string' },
        timestamp: { type: 'string' },
      },
    },
  })
  getHealth() {
    return {
      ok: true,
      app: 'court-protocol-api',
      timestamp: new Date().toISOString(),
    };
  }
}

