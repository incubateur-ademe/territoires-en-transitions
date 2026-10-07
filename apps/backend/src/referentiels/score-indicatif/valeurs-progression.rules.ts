import { ValeursProgression } from '@tet/backend/indicateurs/valeurs/indicateur-expression.service';
import {
  getAnnee,
  LigneValeurProgression,
  pickObjectifSnbc,
  pickValeurDepart,
} from '@tet/backend/indicateurs/valeurs/progression.rules';
import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import {
  IndicateurAssocie,
  scoreIndicatifTypeEnum,
  ValeurUtilisee,
} from '@tet/domain/referentiels';

/**
 * Détermine les indicateurs et les années à charger pour évaluer les appels à
 * `progression_snbc(...)` et `reduction(...)` : les années de départ des
 * appels, plus celles des valeurs `fait` utilisées. L'ensemble d'années est
 * global (pas par indicateur) pour garder une seule requête simple.
 */
export function collectProgressionNeeds(
  indicateursParActionId: Record<string, ReferencedIndicateur[]>,
  indicateursAssocies: IndicateurAssocie[],
  valeursUtiliseesParActionId: Record<string, ValeurUtilisee[]>
): { indicateurIdParIdentifiant: Record<string, number>; annees: number[] } {
  const identifiants = new Set<string>();
  const annees = new Set<number>();
  const actionIdsConcernees: string[] = [];

  Object.entries(indicateursParActionId).forEach(([actionId, refs]) => {
    let concernee = false;
    refs.forEach((ref) => {
      if (!ref.progressions?.length) {
        return;
      }
      concernee = true;
      identifiants.add(ref.identifiant);
      ref.progressions.forEach(({ anneeDepart }) => annees.add(anneeDepart));
    });
    if (concernee) {
      actionIdsConcernees.push(actionId);
    }
  });

  const indicateurIdParIdentifiant = Object.fromEntries(
    indicateursAssocies
      .filter(({ identifiantReferentiel }) =>
        identifiants.has(identifiantReferentiel)
      )
      .map(({ identifiantReferentiel, indicateurId }) => [
        identifiantReferentiel,
        indicateurId,
      ])
  );
  const indicateurIdsConcernes = new Set(
    Object.values(indicateurIdParIdentifiant)
  );

  actionIdsConcernees.forEach((actionId) => {
    (valeursUtiliseesParActionId[actionId] ?? [])
      .filter(
        (valeur) =>
          valeur.typeScore === scoreIndicatifTypeEnum.FAIT &&
          indicateurIdsConcernes.has(valeur.indicateurId)
      )
      .forEach(({ dateValeur }) => annees.add(getAnnee(dateValeur)));
  });

  return { indicateurIdParIdentifiant, annees: [...annees] };
}

/** Résout, par identifiant d'indicateur et par année, l'objectif snbc et le résultat de départ */
export function buildValeursProgression(
  indicateurIdParIdentifiant: Record<string, number>,
  annees: number[],
  lignes: Array<LigneValeurProgression & { indicateurId: number }>
): ValeursProgression {
  return Object.fromEntries(
    Object.entries(indicateurIdParIdentifiant).map(
      ([identifiant, indicateurId]) => {
        const lignesIndicateur = lignes.filter(
          (ligne) => ligne.indicateurId === indicateurId
        );
        const parAnnee = Object.fromEntries(
          annees.map((annee) => {
            const objectifSnbc = pickObjectifSnbc(lignesIndicateur, annee);
            const resultatDepart = pickValeurDepart(lignesIndicateur, annee);
            return [
              annee,
              {
                ...(objectifSnbc !== null && { objectifSnbc }),
                ...(resultatDepart !== null && { resultatDepart }),
              },
            ];
          })
        );
        return [identifiant, parAnnee];
      }
    )
  );
}
