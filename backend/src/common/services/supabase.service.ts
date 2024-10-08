import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import BackendConfigurationService from './backend-configuration.service';
import { Database, DBClient } from '@tet/api';

@Injectable()
export default class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  public readonly client: DBClient;

  constructor(backendConfigurationService: BackendConfigurationService) {
    const backendConfiguration =
      backendConfigurationService.getBackendConfiguration();
    this.logger.log(
      `Initializing supabase service with url: ${backendConfiguration.SUPABASE_URL}`
    );
    this.client = createClient<Database>(
      backendConfiguration.SUPABASE_URL,
      backendConfiguration.SUPABASE_SERVICE_ROLE_KEY
    );
  }
}
