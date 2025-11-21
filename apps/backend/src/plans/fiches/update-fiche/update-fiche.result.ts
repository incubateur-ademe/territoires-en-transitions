import { MethodResult } from '@/backend/utils/result.type';
import { UpdateFicheError } from './update-fiche.errors';

export type Result<T, E = UpdateFicheError> = MethodResult<T, E>;
