import {
  StatutAvancementEnum,
  type ActionScoreFinal,
  type ActionStatutCreate,
  type StatutDetailleAuPourcentage,
} from '@tet/domain/referentiels';
import {
  getRatioFromOrigineActions,
  getScoreFromOrigineActionsAndRatio,
} from '@tet/backend/referentiels/compute-score/score-from-origines.rules';
import { getPointPotentiel } from '../shared/action-cible';
import { type SwitchToTeContext } from '../shared/switch-to-te-context';

/** aligné sur ScoresService.DEFAULT_ROUNDING_DIGITS (3 décimales) */
export const MERGE_STATUTS_STATUT_DISCRET_EPSILON = 1e-3;

export type MergeStatutsProjectedPoints = Pick<
  ActionScoreFinal,
  'pointFait' | 'pointProgramme' | 'pointPasFait' | 'pointPotentiel'
>;

export type StatutProjectionInput = MergeStatutsProjectedPoints & {
  concernedSourceCount: number;
};

export type DerivedMergeStatut =
  | {
      statut: typeof StatutAvancementEnum.DETAILLE_AU_POURCENTAGE;
      statutDetailleAuPourcentage: StatutDetailleAuPourcentage;
    }
  | {
      statut: Exclude<
        ActionStatutCreate['statut'],
        | typeof StatutAvancementEnum.DETAILLE_AU_POURCENTAGE
        | typeof StatutAvancementEnum.DETAILLE_A_LA_TACHE
      >;
    };

export const toActionStatutCreate = (
  collectiviteId: number,
  actionId: string,
  derived: DerivedMergeStatut
): ActionStatutCreate => {
  if (derived.statut === StatutAvancementEnum.DETAILLE_AU_POURCENTAGE) {
    return {
      collectiviteId,
      actionId,
      statut: derived.statut,
      statutDetailleAuPourcentage: derived.statutDetailleAuPourcentage,
    };
  }

  return {
    collectiviteId,
    actionId,
    statut: derived.statut,
  };
};

export const deriveTripletFromProjectedPoints = ({
  pointFait,
  pointProgramme,
  pointPasFait,
  pointPotentiel,
}: MergeStatutsProjectedPoints): StatutDetailleAuPourcentage => {
  if (pointPotentiel === 0) {
    return [0, 0, 0];
  }

  return [
    pointFait / pointPotentiel,
    pointProgramme / pointPotentiel,
    pointPasFait / pointPotentiel,
  ];
};

export const isTripletStatutDiscret = (
  triplet: StatutDetailleAuPourcentage,
  epsilon = MERGE_STATUTS_STATUT_DISCRET_EPSILON
): boolean => {
  const [fait, programme, pasFait] = triplet;

  return (
    (fait >= 1 - epsilon && programme <= epsilon && pasFait <= epsilon) ||
    (programme >= 1 - epsilon && fait <= epsilon && pasFait <= epsilon) ||
    (pasFait >= 1 - epsilon && fait <= epsilon && programme <= epsilon)
  );
};

export const deriveStatutDiscret = (
  triplet: StatutDetailleAuPourcentage,
  epsilon = MERGE_STATUTS_STATUT_DISCRET_EPSILON
): DerivedMergeStatut => {
  const [fait, programme] = triplet;

  if (fait >= 1 - epsilon) {
    return { statut: StatutAvancementEnum.FAIT };
  }
  if (programme >= 1 - epsilon) {
    return { statut: StatutAvancementEnum.PROGRAMME };
  }
  return { statut: StatutAvancementEnum.PAS_FAIT };
};

export const arrondiCinqPourcent = (value: number) =>
  Math.floor((value * 100) / 5) * 5;

export const arrondiTripletCinqPourcent = (
  triplet: StatutDetailleAuPourcentage
): StatutDetailleAuPourcentage => {
  const faitPercent = arrondiCinqPourcent(triplet[0]);
  const programmePercent = arrondiCinqPourcent(triplet[1]);
  const pasFaitPercent = 100 - faitPercent - programmePercent;

  return [faitPercent / 100, programmePercent / 100, pasFaitPercent / 100];
};

export const deriveStatutDetailleAuPourcentage = (
  triplet: StatutDetailleAuPourcentage
): DerivedMergeStatut => ({
  statut: StatutAvancementEnum.DETAILLE_AU_POURCENTAGE,
  statutDetailleAuPourcentage: triplet,
});

export const deriveStatutFromProjection = (
  input: StatutProjectionInput
): DerivedMergeStatut => {
  if (input.concernedSourceCount === 0) {
    return { statut: StatutAvancementEnum.NON_CONCERNE };
  }

  const allProjectedPointsZero =
    input.pointFait === 0 &&
    input.pointProgramme === 0 &&
    input.pointPasFait === 0;

  if (allProjectedPointsZero) {
    return { statut: StatutAvancementEnum.NON_RENSEIGNE };
  }

  const triplet = deriveTripletFromProjectedPoints(input);

  if (isTripletStatutDiscret(triplet)) {
    return deriveStatutDiscret(triplet);
  }

  return deriveStatutDetailleAuPourcentage(arrondiTripletCinqPourcent(triplet));
};

const SCORE_ROUNDING_DIGITS = 3;

export const mergeStatuts = (ctx: SwitchToTeContext): ActionStatutCreate[] => {
  const actionStatuts: ActionStatutCreate[] = [];

  for (const cible of ctx.cibles.sousActionsEtTaches) {
    const tePointPotentiel = getPointPotentiel(ctx.teScoreMap, cible.actionId);

    let derivedStatut: DerivedMergeStatut;

    // l'action TE désactivée/non concernée prime sur la projection des sources
    if (!cible.concernee) {
      derivedStatut = { statut: StatutAvancementEnum.NON_CONCERNE };
    } else if (cible.originesConcernees.length === 0) {
      derivedStatut = deriveStatutFromProjection({
        concernedSourceCount: 0,
        pointFait: 0,
        pointProgramme: 0,
        pointPasFait: 0,
        pointPotentiel: tePointPotentiel,
      });
    } else {
      const ratio = getRatioFromOrigineActions(
        cible.originesConcernees,
        tePointPotentiel
      );
      const projected = getScoreFromOrigineActionsAndRatio(
        ratio,
        cible.originesConcernees,
        SCORE_ROUNDING_DIGITS,
        tePointPotentiel
      );

      derivedStatut = deriveStatutFromProjection({
        concernedSourceCount: cible.originesConcernees.length,
        pointFait: projected.pointFait ?? 0,
        pointProgramme: projected.pointProgramme ?? 0,
        pointPasFait: projected.pointPasFait ?? 0,
        pointPotentiel: tePointPotentiel,
      });
    }

    actionStatuts.push(
      toActionStatutCreate(ctx.collectiviteId, cible.actionId, derivedStatut)
    );
  }

  return actionStatuts;
};
