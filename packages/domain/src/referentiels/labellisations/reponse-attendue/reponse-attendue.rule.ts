import { ActionId } from '../../actions/action-definition.schema';
import { ReferentielId } from '../../referentiel-id.enum';
import { getRoleMesureIds } from '../role-mesures/role-mesures';

export type ReponseAttendue =
  | { kind: 'personne-renseignee' }
  | { kind: 'statut-fait' }
  | { kind: 'statut-fait-ou-programme' }
  | { kind: 'pourcentage-fait-minimum'; fait: number }
  | {
      kind: 'pourcentage-fait-ou-programme-minimum';
      fait: number;
      programme: number;
    };

const STATUT_COMPLET_PERCENTAGE = 100;

export const toReponseAttendue = ({
  referentiel,
  actionId,
  minRealisePercentage,
  minProgrammePercentage,
}: {
  referentiel: ReferentielId;
  actionId: ActionId;
  minRealisePercentage: number;
  minProgrammePercentage: number | null;
}): ReponseAttendue => {
  if (getRoleMesureIds(referentiel).includes(actionId)) {
    return { kind: 'personne-renseignee' };
  }
  const isFaitComplet = minRealisePercentage === STATUT_COMPLET_PERCENTAGE;
  if (minProgrammePercentage === null) {
    return isFaitComplet
      ? { kind: 'statut-fait' }
      : { kind: 'pourcentage-fait-minimum', fait: minRealisePercentage };
  }
  if (isFaitComplet && minProgrammePercentage === STATUT_COMPLET_PERCENTAGE) {
    return { kind: 'statut-fait-ou-programme' };
  }
  return {
    kind: 'pourcentage-fait-ou-programme-minimum',
    fait: minRealisePercentage,
    programme: minProgrammePercentage,
  };
};
