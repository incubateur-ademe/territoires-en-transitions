import { MethodResult } from '@tet/backend/utils/result.type';

export type CreateFicheError = string;

export type CreateFicheResult<T, E = CreateFicheError> = MethodResult<T, E>;
