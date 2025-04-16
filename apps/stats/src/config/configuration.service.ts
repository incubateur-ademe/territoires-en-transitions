import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StatsConfigurationType } from './configuration.model';

@Injectable()
export default class ConfigurationService {
  private readonly logger = new Logger(ConfigurationService.name);

  constructor(
    private readonly configService: ConfigService<
      StatsConfigurationType,
      true
    >
  ) {
    this.logger.log(`Initializing configuration service`);
  }

  get(key: keyof StatsConfigurationType) {
    return this.configService.get(key);
  }
}
