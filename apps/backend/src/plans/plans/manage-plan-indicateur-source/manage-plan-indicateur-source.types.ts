import { IndicateurValeursError } from '@tet/backend/indicateurs/valeurs/indicateur-valeurs.errors';
import { ListIndicateurValeursInput } from '@tet/backend/indicateurs/valeurs/list-indicateur-valeurs/list-indicateur-valeurs.input';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import {
  IndicateurSourceCreate,
  IndicateurSourceMetadonneeCreate,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';

export type PlanIndicateurSourceContext = Pick<ServiceSecondArg, 'user' | 'tx'>;

export type PlanIndicateurSourceScope = {
  planId: number;
  sourceId: string;
};

export type CreatePlanIndicateurSourceInput = {
  planId: number;
  source: IndicateurSourceCreate;
  metadonnee: Omit<IndicateurSourceMetadonneeCreate, 'id' | 'sourceId'>;
};

export type ListPlanIndicateurValeursInput = PlanIndicateurSourceScope &
  Omit<
    ListIndicateurValeursInput,
    'collectiviteId' | 'metadonneeId' | 'sources'
  >;

export type FillMissingPlanIndicateurValeursInput =
  PlanIndicateurSourceScope & {
    valeurs: Omit<IndicateurValeurCreate, 'collectiviteId' | 'metadonneeId'>[];
  };

export type PlanIndicateurSourceError = IndicateurValeursError | 'NOT_FOUND';
