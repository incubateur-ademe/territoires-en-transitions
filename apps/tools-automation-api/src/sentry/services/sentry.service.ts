import { Injectable, Logger } from '@nestjs/common';
import ConfigurationService from '../../config/configuration.service';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);

  constructor(private readonly configurationService: ConfigurationService) {}

  async handleErrorAlert(body: any) {}
}
