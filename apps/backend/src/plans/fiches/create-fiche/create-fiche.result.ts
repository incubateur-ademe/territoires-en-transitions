import { Result } from '@tet/backend/utils/result.type';

export type CreateFicheError = string;

export type CreateFicheResult<T, E = CreateFicheError> = Result<T, E>;
