import { ElectrificationCatalogueRules } from '@tet/backend/plans/plans/electrification/publish-electrification-data/electrification-catalogue.rules';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Lien } from '@tet/domain/collectivites';
import { ResolvedSousActionImport } from '../../prepare-fiche/prepare-fiche.schema';
import { ElectrificationConfig } from '@tet/domain/plans';
import { ResolvedElectrificationAxe } from '../resolve-engagements/electrification-engagements.schema';
import { ElectrificationIssue } from '../electrification-issue';
import {
  ElectrificationFicheInput,
  ElectrificationFichesInput,
} from './electrification-fiches.schema';
import { ElectrificationFichesErrors as Errors } from './electrification-fiches.errors';
import { ResolveElectrificationStructureRules } from '../resolve-engagements/resolve-electrification-structure.rules';

export class ResolveElectrificationFichesRules {
  static isCatalogueValid(config: ElectrificationConfig): boolean {
    return ElectrificationCatalogueRules.isValid(config);
  }

  static validateConfig(config: ElectrificationConfig): ElectrificationIssue[] {
    return ElectrificationCatalogueRules.asConfigurationIssues(
      ElectrificationCatalogueRules.validateFiches(config)
    );
  }

  static validateSources(
    input: ElectrificationFichesInput
  ): ElectrificationIssue[] {
    return ResolveElectrificationStructureRules.validateSources(
      input,
      input.fiches.flatMap((f) => [
        f.source,
        ...f.sousActions.map((s) => s.source),
        ...f.indicateurs.map((i) => i.source),
      ])
    );
  }

  static matchesAxe(
    action: NonNullable<ElectrificationConfig['fiches']['actions']>[number],
    axe: ResolvedElectrificationAxe,
    axes: ResolvedElectrificationAxe[]
  ): boolean {
    const parent = axe.parentKey
      ? axes.find((a) => a.key === axe.parentKey)
      : axe;
    return (
      parent?.numero === String(action.axeNumero) &&
      (action.sousAxeNumero === null ||
        (axe.parentKey !== null && axe.numero === action.sousAxeNumero))
    );
  }

  static resolveDocuments(
    aides: NonNullable<
      ElectrificationConfig['fiches']['actions']
    >[number]['aides'],
    location: string
  ): { documents: Lien[]; issues: ElectrificationIssue[] } {
    const documents: Lien[] = [];
    const issues: ElectrificationIssue[] = [];
    for (const { titre, url } of aides) {
      if (url === null) {
        issues.push(
          Errors.issue(
            'AIDE_WITHOUT_URL_IGNORED',
            `${location} — Aide "${titre}"`
          )
        );
        continue;
      }
      documents.push({ titre, url });
    }
    return { documents, issues };
  }

  /** Le profil décide de la validité du code avant la préparation commune. */
  static resolveSousActions(
    fiche: ElectrificationFicheInput,
    defaults:
      | NonNullable<ElectrificationConfig['fiches']['actions']>[number]
      | undefined,
    catalogueAvailable: boolean
  ): Result<ResolvedSousActionImport[], ElectrificationIssue[]> {
    const result: ResolvedSousActionImport[] = [];
    const issues: ElectrificationIssue[] = [];
    for (const item of fiche.sousActions) {
      const reference = defaults?.sousActions.find(
        (s) => s.code === item.reference
      );
      if (item.reference && !reference) {
        issues.push(
          Errors.issue(
            catalogueAvailable
              ? 'UNKNOWN_FICHE_REFERENCE'
              : 'FICHES_CONFIG_UNAVAILABLE',
            item.source.location
          )
        );
        continue;
      }
      result.push({
        source: item.source,
        code: item.reference,
        champs: item.champs,
        defaults: reference?.champs ?? {},
      });
    }
    return issues.length ? failure(issues) : success(result);
  }
}
