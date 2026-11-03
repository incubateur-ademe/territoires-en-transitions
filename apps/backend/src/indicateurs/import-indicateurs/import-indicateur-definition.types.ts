import type { ListIndicateursPredefinisRepository } from '../definitions/list-indicateurs-predefinis/list-indicateurs-predefinis.repository';
import type { AuthenticatedOrServiceRoleUser } from '@tet/backend/users/models/auth.models';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';

export type ImportIndicateurContext = Omit<ServiceSecondArg, 'user'> & {
  user: AuthenticatedOrServiceRoleUser | null;
};
export type IndicateursPredefinis = Awaited<
  ReturnType<ListIndicateursPredefinisRepository['listIndicateursPredefinis']>
>;
export type UpsertIndicateurDefinitionsResult = Readonly<{
  definitions: IndicateursPredefinis;
  updatedFormulaDefinitions: IndicateursPredefinis;
  identifiantsRecalcules: string[];
}>;
