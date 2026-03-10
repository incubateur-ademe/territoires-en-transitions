import { ReferentielId } from '@tet/domain/referentiels';
import { ActionDetailed } from '../../use-snapshot';

// alias et règle les imperfections du typage auto-généré

export type TComparaisonScoreAudit = {
  collectiviteId: number;
  referentielId: ReferentielId;
  actionId: string;
  preAudit: ActionDetailed;
  courant: ActionDetailed;
};

export type TScoreAuditRowData = TComparaisonScoreAudit & ActionDetailed;
