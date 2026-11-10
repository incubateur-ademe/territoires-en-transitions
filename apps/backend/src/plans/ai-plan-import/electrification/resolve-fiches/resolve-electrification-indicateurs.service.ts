import { Injectable } from '@nestjs/common';
import { ListIndicateursService } from '@tet/backend/indicateurs/indicateurs/list-indicateurs/list-indicateurs.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  IndicateurPeriodes,
  IndicateurPeriodicite,
} from '@tet/domain/indicateurs';
import { ElectrificationConfig, StatutEnum } from '@tet/domain/plans';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationImportLocations as Locations } from '../electrification-import-locations';
import { ImportReferenceRules } from '../../resolve-import-reference/import-reference.rules';
import { ResolveImportReferenceService } from '../../resolve-import-reference/resolve-import-reference.service';
import { ElectrificationFichesErrors as Errors } from './electrification-fiches.errors';
import {
  ElectrificationIndicateurInput,
  PreparedElectrificationIndicateur,
  PreparedElectrificationIndicateurValeur,
} from './electrification-fiches.schema';

@Injectable()
export class ResolveElectrificationIndicateursService {
  constructor(
    private readonly indicateurs: ListIndicateursService,
    private readonly references: ResolveImportReferenceService
  ) {}

  /** Appelé après validation de la structure, des sources et des droits d'import. */
  async resolveAll(
    inputs: ElectrificationIndicateurInput[],
    catalogue: ElectrificationConfig,
    collectiviteId: number,
    context: ServiceSecondArg
  ): Promise<
    Result<
      {
        indicateurs: PreparedElectrificationIndicateur[];
        issues: ElectrificationIssue[];
      },
      ElectrificationIssue[]
    >
  > {
    const indicateurs: PreparedElectrificationIndicateur[] = [];
    const issues: ElectrificationIssue[] = [];
    const linkedIds = new Set<number>();
    // Une URL prime même si un code ou un complément désigne le même objet.
    const ordered = [
      ...inputs.filter((input) =>
        ImportReferenceRules.isUrlReference(input.reference)
      ),
      ...inputs.filter(
        (input) => !ImportReferenceRules.isUrlReference(input.reference)
      ),
    ];
    for (const input of ordered) {
      const result = await this.resolve(
        input,
        catalogue,
        collectiviteId,
        linkedIds,
        context
      );
      if (!result.success) {
        issues.push(...result.error);
        continue;
      }
      issues.push(...result.data.issues);
      const indicateur = result.data.indicateur;
      if (indicateur.mode === 'link') {
        if (linkedIds.has(indicateur.indicateurId)) continue;
        linkedIds.add(indicateur.indicateurId);
      } else if (
        indicateur.mode === 'catalogue' &&
        indicateurs.some(
          (existing) =>
            existing.mode === 'catalogue' &&
            existing.indicateurId === indicateur.indicateurId
        )
      ) {
        issues.push(
          Errors.issue('DUPLICATE_FICHE_REFERENCE', input.source.location)
        );
        continue;
      }
      indicateurs.push(indicateur);
    }
    if (
      issues.some(({ kind }) => kind !== 'warning' && kind !== 'preserved-data')
    )
      return failure(issues);
    return success({ indicateurs, issues });
  }

  private async resolve(
    input: ElectrificationIndicateurInput,
    catalogue: ElectrificationConfig,
    collectiviteId: number,
    linkedIds: ReadonlySet<number>,
    context: ServiceSecondArg
  ): Promise<
    Result<
      {
        indicateur: PreparedElectrificationIndicateur;
        issues: ElectrificationIssue[];
      },
      ElectrificationIssue[]
    >
  > {
    const issue = (code: Parameters<typeof Errors.issue>[0], field?: string) =>
      Errors.issue(code, Locations.field(input.source.location, field));
    if (
      input.reference &&
      ImportReferenceRules.isUrlReference(input.reference)
    ) {
      const result = await this.references.resolveIndicateur(
        input.reference,
        collectiviteId,
        context
      );
      if (!result.success)
        return failure(
          result.error.map((error) => ({
            ...error,
            location: input.source.location,
          }))
        );
      return success({
        indicateur: {
          mode: 'link',
          indicateurId: result.data.indicateurId,
          source: input.source,
        },
        issues: [issue('EXISTING_INDICATEUR_PRESERVED')],
      });
    }
    const mappings = catalogue.fiches.indicateurs;
    const mapping = mappings?.find((item) => item.code === input.reference);
    if (
      input.reference &&
      (mappings === null || mapping?.validation === 'pending')
    )
      return failure([issue('FICHES_CONFIG_UNAVAILABLE')]);
    if (input.reference && !mapping)
      return failure([issue('UNKNOWN_FICHE_REFERENCE')]);
    if (mapping && mapping.type !== input.type)
      return failure([issue('INVALID_INDICATEUR_TYPE')]);

    if (input.type === 'booleen') {
      const titre =
        input.titre ?? (mapping?.type === 'booleen' ? mapping.titre : null);
      if (!titre) return failure([issue('MISSING_FICHE_TITLE')]);
      if (input.resultat !== null && input.anneeResultat === null)
        return failure([issue('MISSING_INDICATEUR_YEAR', 'Résultat')]);
      if (input.objectif !== null && input.anneeObjectif === null)
        return failure([issue('MISSING_INDICATEUR_YEAR', 'Objectif')]);
      return success({
        indicateur: {
          mode: 'sous-action',
          source: input.source,
          code: input.reference,
          titre,
          statut:
            input.resultat === true ? StatutEnum.REALISE : StatutEnum.A_VENIR,
          dateFin:
            input.anneeObjectif === null
              ? null
              : `${String(input.anneeObjectif).padStart(4, '0')}-12-31`,
          observation: {
            resultat: input.resultat,
            anneeResultat: input.anneeResultat,
            objectif: input.objectif,
            anneeObjectif: input.anneeObjectif,
          },
        },
        issues: input.resultat === null ? [issue('EMPTY_BOOLEAN_RESULT')] : [],
      });
    }

    let indicateurId: number | null = null;
    let titre = input.titre;
    let unite = input.unite;
    let periodicite: IndicateurPeriodicite = 'annuelle';
    if (mapping?.type === 'quantitatif') {
      if (
        mapping.identifiantReferentiel === null ||
        mapping.unite === null ||
        mapping.periodicite === null
      )
        return failure([issue('FICHES_CONFIG_UNAVAILABLE')]);
      const { data } = await this.indicateurs.listIndicateurs(
        {
          collectiviteId,
          filters: {
            identifiantsReferentiel: [mapping.identifiantReferentiel],
          },
          queryOptions: { page: 1, limit: 2 },
        },
        context.user
      );
      const definition = data[0];
      if (
        data.length !== 1 ||
        definition.unite !== mapping.unite ||
        definition.periodicite !== mapping.periodicite
      )
        return failure([issue('MISSING_FICHE_INDICATEUR')]);
      indicateurId = definition.id;
      titre = definition.titre;
      unite = mapping.unite;
      periodicite = mapping.periodicite;
      if (linkedIds.has(indicateurId)) {
        return success({
          indicateur: { mode: 'link', indicateurId, source: input.source },
          issues: [issue('EXISTING_INDICATEUR_PRESERVED')],
        });
      }
    }
    if (titre === null) return failure([issue('MISSING_FICHE_TITLE')]);
    if (unite === null) return failure([issue('MISSING_INDICATEUR_UNIT')]);
    if (input.unite !== null && input.unite !== unite)
      return failure([issue('INVALID_INDICATEUR_UNIT')]);
    if (input.periodicite !== null && input.periodicite !== periodicite)
      return failure([issue('INVALID_INDICATEUR_PERIODICITY', 'Périodicité')]);
    const valeurs = new Map<string, PreparedElectrificationIndicateurValeur>();
    for (const field of ['resultat', 'objectif'] as const) {
      const valeur = input[field];
      const fieldLabel = field === 'resultat' ? 'Résultat' : 'Objectif';
      if (valeur.valeur === null) continue;
      if (input.unite === null)
        return failure([issue('MISSING_INDICATEUR_UNIT', fieldLabel)]);
      if (valeur.periode === null)
        return failure([
          issue(
            periodicite === 'annuelle'
              ? 'MISSING_INDICATEUR_YEAR'
              : 'INVALID_INDICATEUR_PERIOD',
            fieldLabel
          ),
        ]);
      if (input.periodicite === null)
        return failure([
          issue('INVALID_INDICATEUR_PERIODICITY', 'Périodicité'),
        ]);
      const periode = IndicateurPeriodes.tryParse(periodicite, valeur.periode);
      if (!periode)
        return failure([issue('INVALID_INDICATEUR_PERIOD', fieldLabel)]);
      const dateValeur = IndicateurPeriodes.toDateValeur(periode);
      const existing = valeurs.get(dateValeur) ?? {
        dateValeur,
        resultat: null,
        objectif: null,
      };
      existing[field] = valeur.valeur;
      valeurs.set(dateValeur, existing);
    }
    return success({
      indicateur: {
        mode: mapping ? 'catalogue' : 'create',
        code: input.reference,
        source: input.source,
        indicateurId,
        titre,
        unite,
        periodicite,
        valeurs: [...valeurs.values()],
      },
      issues: [],
    });
  }
}
