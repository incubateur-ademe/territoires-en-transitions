import {
  Fiche,
  StatutEnum,
} from '@/backend/plans/fiches/shared/models/fiche-action.table';
import { isBefore } from 'date-fns';

export const isActionOnTime = ({
  statut,
  dateFin,
}: {
  statut: Fiche['statut'];
  dateFin: Fiche['dateFin'];
}): boolean => {
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
