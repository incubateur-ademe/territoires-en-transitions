import type { ListPlatformDefinitionsRepository } from '../definitions/list-platform-definitions/list-platform-definitions.repository';
import type { AuthenticatedOrServiceRoleUser } from '@tet/backend/users/models/auth.models';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';

export type ImportIndicateurContext = Omit<ServiceSecondArg, 'user'> & {
  user: AuthenticatedOrServiceRoleUser | null;
};
export type PlatformDefinitions = Awaited<
  ReturnType<ListPlatformDefinitionsRepository['listPlatformDefinitions']>
>;
export type UpsertIndicateurDefinitionsResult = Readonly<{
  definitions: PlatformDefinitions;
  updatedFormulaDefinitions: PlatformDefinitions;
  importedIndicateurIds: number[];
  reconciliationWorkItemsCount: number;
}>;
