import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { ConfigService } from '../../config/config.service';
import { Database, DBClient } from '@tet/api';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  public readonly client: DBClient;

  constructor(configService: ConfigService) {
    const supabaseUrl = configService.get('SUPABASE_URL');
    this.logger.log(`Initializing supabase service with url: ${supabaseUrl}`);
    this.client = createClient<Database>(
      supabaseUrl,
      configService.get('SUPABASE_SERVICE_ROLE_KEY')
    );
  }
}
