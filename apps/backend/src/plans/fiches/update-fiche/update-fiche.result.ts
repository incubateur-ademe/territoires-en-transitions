import { MethodResult } from '@tet/backend/utils/result.type';
import { UpdateFicheError } from './update-fiche.errors';

export type UpdateFicheResult<T, E = UpdateFicheError> = MethodResult<T, E>;
