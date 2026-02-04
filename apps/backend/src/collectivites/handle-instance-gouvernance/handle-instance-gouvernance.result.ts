import { Result as GenericResult } from '@tet/backend/utils/result.type';
import { InstanceGouvernance } from '@tet/domain/collectivites';
import { InstanceGouvernanceError } from './handle-instance-gouvernance.errors';
export type Result<T = InstanceGouvernance> = GenericResult<
  T,
  InstanceGouvernanceError,
  Error
>;
