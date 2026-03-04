import {
  type ActionStatutCreate,
  type StatutAvancementCreateInDatabase,
  StatutAvancementEnum,
  type StatutDetailleAuPourcentage,
} from '@tet/domain/referentiels';

// Valeurs par defaut de l'avancement detaille par statut d'avancement
export const AVANCEMENT_DETAILLE_PAR_STATUT: Record<
  StatutAvancementCreateInDatabase,
  [number, number, number] | null
> = {
  non_renseigne: null,
  fait: [1, 0, 0],
  programme: [0, 1, 0],
  pas_fait: [0, 0, 1],
  detaille: [0.5, 0.25, 0.25],
};

export function inferStatutDetailleAuPourcentageFromStatut(
  statut: StatutAvancementCreateInDatabase
): [number, number, number] {
  return AVANCEMENT_DETAILLE_PAR_STATUT[statut] ?? [0, 0, 0];
}

function inferStatutFromStatutDetailleAuPourcentage(
  statutDetailleAuPourcentage: StatutDetailleAuPourcentage | null | undefined
): StatutAvancementCreateInDatabase {
  if (!statutDetailleAuPourcentage) {
    return StatutAvancementEnum.NON_RENSEIGNE;
  }

  return statutDetailleAuPourcentage[0] === 1
    ? StatutAvancementEnum.FAIT
    : statutDetailleAuPourcentage[1] === 1
    ? StatutAvancementEnum.PROGRAMME
    : statutDetailleAuPourcentage[2] === 1
    ? StatutAvancementEnum.PAS_FAIT
    : StatutAvancementEnum.DETAILLE_AU_POURCENTAGE;
}

export function actionStatutCreateToActionStatutInDatabase({
  statut,
  statutDetailleAuPourcentage,
}: Pick<ActionStatutCreate, 'statut' | 'statutDetailleAuPourcentage'>): {
  avancement: StatutAvancementCreateInDatabase;
  avancementDetaille: [number, number, number] | null;
  concerne: boolean;
} {
  // Cas special pour le faux statut "non concerne".
  if (statut === StatutAvancementEnum.NON_CONCERNE) {
    return {
      avancement: StatutAvancementEnum.NON_RENSEIGNE,
      avancementDetaille: null,
      concerne: false,
    };
  }

  if (statut === StatutAvancementEnum.DETAILLE_A_LA_TACHE) {
    return {
      avancement: StatutAvancementEnum.NON_RENSEIGNE,
      avancementDetaille: null,
      concerne: true,
    };
  }

  if (statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE) {
    const overriddenStatut = inferStatutFromStatutDetailleAuPourcentage(
      statutDetailleAuPourcentage
    );

    return {
      avancement: overriddenStatut,
      avancementDetaille:
        overriddenStatut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE
          ? statutDetailleAuPourcentage ?? null
          : null,
      concerne: true,
    };
  }

  return {
    avancement: statut,
    // Quand on change l'avancement, le detail est reinitialise a la valeur par defaut correspondante.
    avancementDetaille: AVANCEMENT_DETAILLE_PAR_STATUT[statut],
    concerne: true,
  };
}
