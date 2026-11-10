import {
  PersistPlanIndicateurEntry,
  PersistPlanIndicateursError,
  PersistPlanIndicateursInput,
  PersistPlanIndicateursOutput,
} from '@tet/backend/plans/plans/persist-plan-indicateurs/persist-plan-indicateurs.types';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ELECTRIFICATION_SOURCE_ID } from '@tet/domain/indicateurs';
import { ElectrificationConfig } from '@tet/domain/plans';
import { ElectrificationIssue } from '../electrification-issue';
import {
  PreparedElectrificationIndicateur,
  ResolvedElectrificationFiches,
} from '../resolve-fiches/electrification-fiches.schema';
import { ElectrificationPersistenceErrors as Errors } from './electrification-persistence.errors';

type SourceLocations = Map<string, string>;
type AdaptedIndicateurs = {
  input: PersistPlanIndicateursInput;
  locations: SourceLocations;
};

/** Traduit les règles documentaires en écritures neutres ; aucun accès à la base. */
export class ElectrificationIndicateursAdapter {
  static toPersistence(
    prepared: ResolvedElectrificationFiches,
    catalogue: ElectrificationConfig,
    {
      collectiviteId,
      dateVersion,
    }: { collectiviteId: number; dateVersion: string }
  ): Result<AdaptedIndicateurs, ElectrificationIssue[]> {
    const locations: SourceLocations = new Map();
    const indicateurs: PersistPlanIndicateurEntry[] = prepared.cibles.map(
      (cible) => {
        locations.set(cible.key, cible.source.location);
        return {
          sourceKey: cible.key,
          target: { axeSourceKey: cible.axeKey },
          indicateurId: cible.indicateurId,
          expectedDefinition: {
            identifiantReferentiel: cible.identifiantReferentiel,
            unite: cible.unite,
            periodicite: cible.periodicite,
          },
          valeurs: {
            scope: 'plan',
            values:
              cible.objectif === null
                ? []
                : [
                    {
                      dateValeur: cible.dateValeur,
                      periodicite: cible.periodicite,
                      objectif: cible.objectif,
                    },
                  ],
          },
        };
      }
    );
    for (const fiche of prepared.fiches) {
      if (fiche.mode === 'link') continue;
      for (const indicateur of fiche.indicateurs) {
        if (indicateur.mode === 'sous-action') continue;
        const entry = this.toFicheIndicateur(indicateur, fiche.key, catalogue);
        if (!entry.success) return entry;
        locations.set(entry.data.sourceKey, indicateur.source.location);
        indicateurs.push(entry.data);
      }
    }
    return success({
      locations,
      input: {
        collectiviteId,
        indicateurs,
        source: prepared.cibles.length
          ? {
              source: {
                id: ELECTRIFICATION_SOURCE_ID,
                libelle: 'Annexe 3 Électrification',
              },
              metadonnee: {
                dateVersion,
                nomDonnees: 'Cibles du tableau A',
              },
            }
          : undefined,
      },
    });
  }

  static toIssues(
    errors: PersistPlanIndicateursError[],
    locations: SourceLocations
  ): ElectrificationIssue[] {
    return errors.map(({ code, sourceKey }) =>
      Errors.issue(
        code === 'REFERENCES_CHANGED'
          ? 'ELECTRIFICATION_REFERENCES_CHANGED'
          : 'ELECTRIFICATION_PERSISTENCE_FAILED',
        sourceKey === undefined ? undefined : locations.get(sourceKey)
      )
    );
  }

  static toConflictIssues(
    { conflits }: PersistPlanIndicateursOutput,
    locations: SourceLocations
  ): ElectrificationIssue[] {
    return conflits.map(({ sourceKey }) =>
      Errors.issue(
        'EXISTING_INDICATEUR_VALUE_PRESERVED',
        locations.get(sourceKey)
      )
    );
  }

  private static toFicheIndicateur(
    indicateur: Exclude<
      PreparedElectrificationIndicateur,
      { mode: 'sous-action' }
    >,
    ficheSourceKey: string,
    catalogue: ElectrificationConfig
  ): Result<PersistPlanIndicateurEntry, ElectrificationIssue[]> {
    const entry = {
      sourceKey: `indicateur:${ficheSourceKey}:${indicateur.source.key}`,
      target: { ficheSourceKey },
    };
    // Une URL ne permet ni de modifier la définition ni de compléter les valeurs.
    if (indicateur.mode === 'link')
      return success({ ...entry, indicateurId: indicateur.indicateurId });

    const valeurs = {
      scope: 'collectivite' as const,
      values: indicateur.valeurs.map((value) => ({
        ...value,
        periodicite: indicateur.periodicite,
      })),
    };
    if (indicateur.mode === 'create') {
      return success({
        ...entry,
        definition: {
          titre: indicateur.titre,
          unite: indicateur.unite,
          periodicite: indicateur.periodicite,
          thematiques: [],
          estFavori: false,
          estConfidentiel: false,
          isApplicable: true,
        },
        valeurs,
      });
    }
    const mapping = catalogue.fiches.indicateurs?.find(
      ({ code }) => code === indicateur.code
    );
    if (mapping?.type !== 'quantitatif' || indicateur.indicateurId === null) {
      return failure([
        Errors.issue(
          'ELECTRIFICATION_REFERENCES_CHANGED',
          indicateur.source.location
        ),
      ]);
    }
    return success({
      ...entry,
      indicateurId: indicateur.indicateurId,
      expectedDefinition: {
        identifiantReferentiel: mapping.identifiantReferentiel,
        unite: indicateur.unite,
        periodicite: indicateur.periodicite,
      },
      valeurs,
    });
  }
}
