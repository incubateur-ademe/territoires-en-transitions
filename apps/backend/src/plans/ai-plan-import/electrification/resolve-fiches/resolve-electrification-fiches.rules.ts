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
    action: ElectrificationConfig['fiches']['actions'][number],
    axe: ResolvedElectrificationAxe,
    axes: ResolvedElectrificationAxe[]
  ): boolean {
    const parent = axe.parentKey
      ? axes.find((a) => a.key === axe.parentKey)
      : axe;
    return (
      parent?.numero === String(action.axeNumero) &&
      (axe.parentKey === null ||
        action.sousAxeNumero === null ||
        axe.numero === action.sousAxeNumero)
    );
  }

  static resolveDocuments(
    aides: ElectrificationConfig['fiches']['actions'][number]['aides']
  ): Lien[] {
    const documents: Lien[] = [];
    for (const { titre, url } of aides) {
      if (url === null) continue;
      documents.push({ titre, url });
    }
    return documents;
  }

  /** Le profil décide de la validité du code avant la préparation commune. */
  static resolveSousActions(
    fiche: ElectrificationFicheInput,
    defaults: ElectrificationConfig['fiches']['actions'][number] | undefined
  ): Result<ResolvedSousActionImport[], ElectrificationIssue[]> {
    const result: ResolvedSousActionImport[] = [];
    const issues: ElectrificationIssue[] = [];
    for (const item of fiche.sousActions) {
      const reference = item.reference
        ? defaults?.sousActions.find((s) => s.code === item.reference)
        : this.findSousActionByTitle(item, fiche.sousActions, defaults);
      if (item.reference && !reference) {
        issues.push(
          Errors.unknownReference(item.reference, item.source.location)
        );
        continue;
      }
      result.push({
        source: item.source,
        code: reference?.code ?? item.reference,
        champs: item.champs,
        defaults: reference?.champs ?? {},
      });
    }
    return issues.length ? failure(issues) : success(result);
  }
  /** Le Word ne porte pas de code enfant : seul un titre exact et unique est rapproché. */
  private static findSousActionByTitle(
    item: ElectrificationFicheInput['sousActions'][number],
    sousActions: ElectrificationFicheInput['sousActions'],
    action: ElectrificationConfig['fiches']['actions'][number] | undefined
  ) {
    const titre = item.champs.titre;
    if (
      !titre ||
      sousActions.filter((s) => s.champs.titre === titre).length !== 1
    )
      return undefined;
    const matches =
      action?.sousActions.filter((s) => s.champs.titre === titre) ?? [];
    return matches.length === 1 ? matches[0] : undefined;
  }
}
