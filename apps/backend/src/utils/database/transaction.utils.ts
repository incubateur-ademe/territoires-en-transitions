import { DatabaseService } from '@/backend/utils/database/database.service';

export type Transaction = Parameters<
  Parameters<ReturnType<DatabaseService['rls']>>[0]
>[0];
