import { DatabaseService } from '@/backend/utils';

export type Transaction = Parameters<Parameters<ReturnType<DatabaseService['rls']>>[0]>[0];
