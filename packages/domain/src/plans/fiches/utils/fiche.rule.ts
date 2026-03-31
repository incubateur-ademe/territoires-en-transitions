import { isBefore } from 'date-fns';
import { Fiche } from '../fiche.schema';
import { StatutEnum } from '../statut.enum.schema';

export const canLinkInstanceGouvernanceToFiche = ({
  ficheCollectiviteId,
  instanceGouvernanceCollectiviteId,
}: {
  ficheCollectiviteId: number;
  instanceGouvernanceCollectiviteId: number;
}): boolean => {
  return ficheCollectiviteId === instanceGouvernanceCollectiviteId;
};

export const isFicheOnTime = ({
  statut,
  dateFin,
}: Pick<Fiche, 'statut' | 'dateFin'>): boolean => {
  if (statut === StatutEnum.REALISE || statut === StatutEnum.ABANDONNE) {
    return true;
  }
  if (!dateFin) {
    return true;
  }
  if (isBefore(new Date(Date.now()), new Date(dateFin))) {
    return true;
  }
  return false;
};
