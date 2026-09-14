import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import { CollectiviteAvecType } from '@tet/domain/collectivites';
import { IndicateurAssocie } from '@tet/domain/referentiels';
import { IndicateurDefinitionAvecCategories } from './score-indicatif.repository';

/**
 * Certains indicateurs sont propres à la localisation de la collectivité :
 * exclut ceux qui ne s'appliquent pas à son territoire (DROM ou hors-DROM)
 */
export function filterIndicateursByLocalisation(
  indicateurs: IndicateurDefinitionAvecCategories[],
  identiteCollectivite: CollectiviteAvecType
): IndicateurDefinitionAvecCategories[] {
  const excluded = identiteCollectivite.drom ? 'hors_dom' : 'dom';
  return indicateurs.filter((ind) => !ind.categories.includes(excluded));
}

export type IndicateursAssociesResult = {
  indicateursAssocies: IndicateurAssocie[];
  identifiantsManquants: { actionId: string; identifiant: string }[];
};

/**
 * Associe, pour chaque action, les indicateurs référencés dans sa formule aux
 * définitions d'indicateurs effectivement disponibles
 */
export function buildIndicateursAssocies(
  indicateursParActionId: Record<string, ReferencedIndicateur[]>,
  indicateursFiltres: IndicateurDefinitionAvecCategories[]
): IndicateursAssociesResult {
  const identifiantsManquants: { actionId: string; identifiant: string }[] = [];

  const indicateursAssocies = Object.entries(indicateursParActionId).flatMap(
    ([actionId, actionIndicateurs]) =>
      actionIndicateurs
        .map(({ identifiant, optional }) => {
          const indicateur = indicateursFiltres.find(
            (ind) => ind.identifiantReferentiel === identifiant
          );
          if (!indicateur) {
            identifiantsManquants.push({ actionId, identifiant });
            return null;
          }
          const { indicateurId, unite, titre } = indicateur;
          return {
            actionId,
            indicateurId,
            unite,
            titre,
            identifiantReferentiel: identifiant,
            optional,
          };
        })
        .filter((ind) => ind !== null)
  );

  return { indicateursAssocies, identifiantsManquants };
}
