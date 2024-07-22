import { Controller, Get, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import SheetService from './spreadsheets/services/sheet.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly sheetService: SheetService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('exception')
  getException(): string {
    throw new NotFoundException('User not found');
  }

  @Get('test')
  getTestResult() {
    return this.sheetService.testDownload();
  }
}
