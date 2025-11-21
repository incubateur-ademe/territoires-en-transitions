import { MethodResult } from '@/backend/utils/result.type';

export type CreateFicheError = string;

export type Result<T, E = CreateFicheError> = MethodResult<T, E>;
