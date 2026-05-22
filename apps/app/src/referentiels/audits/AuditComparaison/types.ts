import { ReferentielId } from '@tet/domain/referentiels';
import { ActionListItem } from '../../actions/use-list-actions';
import { ActionDetailed } from '../../use-snapshot';

// alias et règle les imperfections du typage auto-généré

export type TComparaisonScoreAudit = {
  collectiviteId: number;
  referentielId: ReferentielId;
  actionId: string;
  preAudit: ActionDetailed;
  courant: ActionDetailed;
};

/** Ligne renvoyée par la requête de comparaison (scores snapshot) */
export type TScoreAuditRowData = TComparaisonScoreAudit & ActionDetailed;

/** Ligne affichée dans la table (référentiel + comparaison audit) */
export type TScoreAuditTableRow = ActionListItem & TComparaisonScoreAudit;
