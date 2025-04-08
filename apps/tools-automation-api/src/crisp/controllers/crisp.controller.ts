import { Body, Controller, Post } from '@nestjs/common';

import { CrispService } from '../services/crisp.service';

@Controller('crisp')
export class CrispController {
  constructor(private readonly crispService: CrispService) {}

  @Post('sessions/callback')
  handleSessionChange(@Body() body: any) {
    return this.crispService.handleMessageReceived(body);
  }
}
