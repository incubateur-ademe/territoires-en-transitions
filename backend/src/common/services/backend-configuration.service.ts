import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  backendConfigurationSchema,
  BackendConfigurationType,
} from '../models/backend-configuration.models';

@Injectable()
export default class BackendConfigurationService {
  private readonly logger = new Logger(BackendConfigurationService.name);

  constructor(private readonly configService: ConfigService) {}

  getBackendConfiguration(): BackendConfigurationType {
    return backendConfiguration;
  }
}

const logger = new Logger(BackendConfigurationService.name);
let backendConfiguration: BackendConfigurationType;
export const validateBackendConfiguration = (
  config: Record<string, unknown>,
) => {
  logger.log('Validating backend configuration');
  backendConfiguration = backendConfigurationSchema.parse(config);
  return config;
};
