import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import ConfigurationService from '../../config/configuration.service';

@Injectable()
export default class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  public readonly client: SupabaseClient;

  constructor(configService: ConfigurationService) {
    const supabaseUrl = configService.get('SUPABASE_URL');
    this.logger.log(`Initializing supabase service with url: ${supabaseUrl}`);
    this.client = createClient(
      supabaseUrl,
      configService.get('SUPABASE_SERVICE_ROLE_KEY')
    );
  }
}
