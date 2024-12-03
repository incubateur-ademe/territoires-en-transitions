import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { BackendConfigurationType } from './config.model';

@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(
    private readonly config: NestConfigService<BackendConfigurationType, true>
  ) {
    this.logger.log(`Initializing configuration service`);
  }

  get(key: keyof BackendConfigurationType) {
    return this.config.get(key);
  }
}
