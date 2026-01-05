import { Result } from '@tet/backend/utils/result.type';
import { UpdateFicheError } from './update-fiche.errors';

export type UpdateFicheResult<T, E = UpdateFicheError> = Result<T, E>;
