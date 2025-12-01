import { MethodResult } from '@tet/backend/utils/result.type';
import { PlanError } from './plans.errors';

export type Result<T, E = PlanError> = MethodResult<T, E>;
