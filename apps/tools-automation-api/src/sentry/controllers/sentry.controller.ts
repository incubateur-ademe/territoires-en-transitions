import { Body, Controller, Post } from '@nestjs/common';
import { SentryService } from '../services/sentry.service';

@Controller('sentry')
export class SentryController {
  constructor(private readonly datadogService: SentryService) {}

  @Post('errors/callback')
  handleErrorAlert(@Body() body: any) {
    console.log('Received error alert from Datadog');
    console.log(JSON.stringify(body, null, 2));
  }
}
