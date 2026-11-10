import { CreateIndicateurInput } from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/mutate-indicateur.input';
import { IndicateurValeursError } from '@tet/backend/indicateurs/valeurs/indicateur-valeurs.errors';
import { IndicateurValeurConflict } from '@tet/backend/indicateurs/valeurs/write-indicateur-valeurs/fill-missing-indicateur-valeurs.rules';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { Indicateur, IndicateurValeurCreate } from '@tet/domain/indicateurs';
import { CreatePlanIndicateurSourceInput } from '../manage-plan-indicateur-source/manage-plan-indicateur-source.types';

export type PersistPlanIndicateurEntry = {
  /** Clé de corrélation unique dans ce lot, indépendante du libellé. */
  sourceKey: string;
  target: { ficheSourceKey: string } | { axeSourceKey: string };
  /** Sans valeurs, la définition et ses relations sont seules concernées. */
  valeurs?: {
    scope: 'collectivite' | 'plan';
    values: Pick<
      IndicateurValeurCreate,
      'dateValeur' | 'periodicite' | 'resultat' | 'objectif'
    >[];
  };
} & (
  | {
      indicateurId: number;
      expectedDefinition?: Pick<
        Indicateur,
        'identifiantReferentiel' | 'unite' | 'periodicite'
      >;
      definition?: never;
    }
  | {
      definition: Omit<CreateIndicateurInput, 'collectiviteId' | 'ficheId'>;
      indicateurId?: never;
      expectedDefinition?: never;
    }
);

export type PersistPlanIndicateursInput = {
  collectiviteId: number;
  /** L'ordre détermine la priorité des cellules fournies plusieurs fois. */
  indicateurs: PersistPlanIndicateurEntry[];
  source?: Omit<CreatePlanIndicateurSourceInput, 'planId'>;
};

export type PersistPlanIndicateursContext = Pick<ServiceSecondArg, 'user'> & {
  tx: Transaction;
};

export type PersistPlanIndicateursOutput = {
  indicateurIdsBySourceKey: Map<string, number>;
  conflits: {
    sourceKey: string;
    conflit: IndicateurValeurConflict;
  }[];
};

export type PersistPlanIndicateursError = {
  code: CommonError | IndicateurValeursError | 'REFERENCES_CHANGED';
  sourceKey?: string;
};
