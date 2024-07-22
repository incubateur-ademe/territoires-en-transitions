import { Controller, Get, NotFoundException } from '@nestjs/common';
import { AppService } from './app.service';
import SheetService from './spreadsheets/services/sheet.service';
import CollectivitesService from './collectivites/services/collectivites.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly sheetService: SheetService,
    private readonly collectiviteService: CollectivitesService,
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

  @Get('collectivite')
  getCollectivite() {
    return this.collectiviteService.getEpciBySiren('200043495');
  }
}
