import { failure, Result, success } from '@tet/backend/utils/result.type';
import { Lien } from '@tet/domain/collectivites';
import { ResolvedSousActionImport } from '../../prepare-fiche/prepare-fiche.schema';
import {
  ElectrificationConfig,
  ElectrificationEngagementCodeEnum,
} from '@tet/domain/plans';
import { ResolvedElectrificationAxe } from '../resolve-engagements/electrification-engagements.schema';
import { ElectrificationIssue } from '../electrification-issue';
import {
  ElectrificationFicheInput,
  ElectrificationFichesInput,
} from './electrification-fiches.schema';
import { ElectrificationFichesErrors as Errors } from './electrification-fiches.errors';
import { ResolveElectrificationStructureRules } from '../resolve-engagements/resolve-electrification-structure.rules';

export class ResolveElectrificationFichesRules {
  /** Les correspondances sont vérifiées lors de la résolution des références utilisées. */
  static isCatalogueValid(config: ElectrificationConfig): boolean {
    const expectedEngagements = Object.values(
      ElectrificationEngagementCodeEnum
    );
    return (
      config.sousAxes !== null &&
      config.fiches.actions !== null &&
      config.fiches.indicateurs !== null &&
      config.engagements.length === expectedEngagements.length &&
      expectedEngagements.every((code) =>
        config.engagements.some((engagement) => engagement.code === code)
      ) &&
      ResolveElectrificationStructureRules.validateCatalogue(config).length ===
        0 &&
      this.validateConfig(config).length === 0
    );
  }

  static validateConfig(config: ElectrificationConfig): ElectrificationIssue[] {
    const invalid = () => [Errors.issue('INVALID_FICHES_CONFIG')];
    const actions = config.fiches.actions ?? [];
    const indicateurs = config.fiches.indicateurs ?? [];
    if (
      new Set(actions.map((a) => a.code)).size !== actions.length ||
      new Set(indicateurs.map((i) => i.code)).size !== indicateurs.length
    )
      return invalid();
    for (const action of actions) {
      if (
        !config.axes.some((a) => a.numero === action.axeNumero) ||
        (action.sousAxeNumero !== null &&
          !config.sousAxes?.some(
            (a) =>
              a.numero === action.sousAxeNumero &&
              a.axeNumero === action.axeNumero
          )) ||
        new Set(action.sousActions.map((s) => s.code)).size !==
          action.sousActions.length ||
        new Set(action.indicateurCodes).size !==
          action.indicateurCodes.length ||
        action.indicateurCodes.some(
          (code) => !indicateurs.some((i) => i.code === code)
        )
      )
        return invalid();
    }
    return [];
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
