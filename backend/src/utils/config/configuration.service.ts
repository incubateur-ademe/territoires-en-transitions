import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BackendConfigurationType } from './configuration.model';

@Injectable()
export default class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  constructor(
    private readonly configService: ConfigService<
      BackendConfigurationType,
      true
    >
  ) {
    this.logger.log(`Initializing configuration service`);
  }

  get(key: keyof BackendConfigurationType) {
    return this.configService.get(key);
  }
}
