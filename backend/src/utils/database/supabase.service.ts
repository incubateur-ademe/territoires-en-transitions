import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import ConfigurationService from '../config/configuration.service';

@Injectable()
export default class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  private readonly serviceRoleClient: ReturnType<typeof createClient>;

  constructor(private readonly configService: ConfigurationService) {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    this.logger.log(`Initializing supabase service with url: ${supabaseUrl}`);

    this.serviceRoleClient = createClient(
      supabaseUrl,
      this.configService.get('SUPABASE_SERVICE_ROLE_KEY')
    );
  }

  getServiceRoleClient() {
    return this.serviceRoleClient;
  }
}
