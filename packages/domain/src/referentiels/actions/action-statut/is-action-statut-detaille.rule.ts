import {
  StatutAvancement,
  StatutAvancementDetaille,
  StatutAvancementEnum,
} from '../action-statut-avancement.enum.schema';

export function isActionStatutDetaille(
  statut: StatutAvancement | null | undefined
): statut is StatutAvancementDetaille {
  return (
    statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE ||
    statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE
  );
}
