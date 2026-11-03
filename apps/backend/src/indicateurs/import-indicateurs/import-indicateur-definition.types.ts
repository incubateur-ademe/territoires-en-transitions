import type { AuthenticatedOrServiceRoleUser } from '@tet/backend/users/models/auth.models';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import type { IndicateurPredefini } from '@tet/domain/indicateurs';

export type ImportIndicateurContext = Omit<ServiceSecondArg, 'user'> & {
  user: AuthenticatedOrServiceRoleUser | null;
};
export type IndicateursPredefinis = IndicateurPredefini[];
export type UpsertIndicateurDefinitionsResult = Readonly<{
  definitions: IndicateursPredefinis;
  updatedFormulaDefinitions: IndicateursPredefinis;
  identifiantsRecalcules: string[];
}>;
