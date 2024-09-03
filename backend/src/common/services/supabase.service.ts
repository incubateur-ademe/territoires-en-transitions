import { Database } from '@library/database.types';
import { DBClient } from '@library/typeUtils';
import { Injectable, Logger } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

@Injectable()
export default class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);

  public readonly client: DBClient;

  constructor() {
    if (!process.env.SUPABASE_URL) {
      process.env.SUPABASE_URL = 'http://127.0.0.1:54321';
    }
    this.logger.log(
      `Initializing supabase service with url: ${process.env.SUPABASE_URL}`,
    );
    this.client = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! || 'pwd', // TODO: Use env var
    );
  }
}
