import { MethodResult } from '@tet/backend/utils/result.type';
import { InstanceGouvernanceError } from './errors';

export type Result<T, E = InstanceGouvernanceError> = MethodResult<T, E>;
