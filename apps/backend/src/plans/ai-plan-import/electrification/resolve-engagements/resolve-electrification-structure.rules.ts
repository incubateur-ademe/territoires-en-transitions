import { ElectrificationCatalogueRules } from '@tet/backend/plans/plans/electrification/publish-electrification-data/electrification-catalogue.rules';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig, StatutEnum } from '@tet/domain/plans';
import { ImportSource } from '../../models/import-source.schema';
import { electrificationEngagementsIssue } from './electrification-engagements.errors';
import {
  ElectrificationEngagementsInput,
  ResolvedElectrificationAxe,
  ResolvedElectrificationEngagements,
} from './electrification-engagements.schema';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationEngagementValuesRules } from './electrification-engagement-values.rules';

export class ResolveElectrificationStructureRules {
  static resolve(
    input: ElectrificationEngagementsInput,
    catalogue: ElectrificationConfig
  ): Result<ResolvedElectrificationEngagements, ElectrificationIssue[]> {
    const issues = this.validateCatalogue(catalogue);
    if (issues.length) return failure(issues);
    issues.push(...this.validateSources(input));

    const result: ResolvedElectrificationEngagements = {
      catalogueVersion: catalogue.version,
      axes: [],
      engagements: [],
      fichesEngagements: [],
      cibles: [],
      report: { issues: [], qualitativeReview: null },
    };
    const engagementCodes = new Set<string>();
    const axes = new Map<string, ResolvedElectrificationAxe>();
    for (const engagement of input.engagements) {
      const cibleKeys = new Set<string>();
      const reference = catalogue.engagements.find(
        ({ code }) => code === engagement.code
      );
      for (const cible of engagement.cibles) {
        if (cibleKeys.has(cible.key)) {
          issues.push(
            this.issue('DUPLICATE_TARGET_KEY', cible.source.location)
          );
        }
        cibleKeys.add(cible.key);
        if (
          reference &&
          !reference.cibles.some(({ key }) => key === cible.key)
        ) {
          issues.push(this.issue('UNKNOWN_TARGET_KEY', cible.source.location));
        }
      }
      if (engagementCodes.has(engagement.code)) {
        issues.push(
          ElectrificationEngagementValuesRules.duplicate(
            engagement.code,
            engagement.source.location
          )
        );
        continue;
      }
      engagementCodes.add(engagement.code);
      if (!reference) {
        issues.push(
          this.issue('UNKNOWN_ENGAGEMENT', engagement.source.location)
        );
        continue;
      }
      const axeReference = catalogue.axes.find(
        ({ numero }) => numero === reference.axeNumero
      );
      // validateCatalogue garantit l'existence de ce parent.
      if (!axeReference) continue;
      const axeKey = this.addNumberedAxe(axes, axeReference, engagement.source);
      result.engagements.push({
        code: engagement.code,
        axeKey,
        source: engagement.source,
      });
      if (reference.actionTitre !== null) {
        result.fichesEngagements.push({
          key: `engagement:${engagement.code}:action`,
          axeKey,
          engagementCode: engagement.code,
          titre: reference.actionTitre,
          statut: StatutEnum.A_VENIR,
          source: engagement.source,
        });
      }
    }

    for (const axe of input.axes) {
      let axeKey: string;
      if (axe.numero === null) {
        axeKey = `libre:${axe.source.key}`;
        axes.set(axeKey, {
          key: axeKey,
          parentKey: null,
          numero: null,
          titre: axe.titre,
          sources: [axe.source],
        });
      } else {
        const reference = catalogue.axes.find(
          ({ numero }) => numero === axe.numero
        );
        if (!reference) {
          issues.push({
            ...this.issue('UNKNOWN_AXIS', axe.source.location),
            message: `L'axe ${
              axe.numero
            } ne figure pas dans le catalogue. Axes disponibles : ${catalogue.axes
              .map(({ numero }) => numero)
              .join(
                ', '
              )}. Vérifiez le champ Axe dans le référentiel fourni avec le canevas.`,
          });
          continue;
        }
        axeKey = this.addNumberedAxe(axes, reference, axe.source);
      }
      for (const sousAxe of axe.sousAxes) {
        if (sousAxe.numero === null) {
          const key = `libre:${sousAxe.source.key}`;
          axes.set(key, {
            key,
            parentKey: axeKey,
            numero: null,
            titre: sousAxe.titre,
            sources: [sousAxe.source],
          });
          continue;
        }
        const reference = catalogue.sousAxes.find(
          ({ numero }) => numero === sousAxe.numero
        );
        if (!reference) {
          issues.push({
            ...this.issue('UNKNOWN_SUB_AXIS', sousAxe.source.location),
            message: `Le sous-axe ${
              sousAxe.numero
            } ne figure pas dans le catalogue. Sous-axes disponibles pour cet axe : ${
              catalogue.sousAxes
                .filter(({ axeNumero }) => axeNumero === axe.numero)
                .map(({ numero }) => numero)
                .join(', ') || 'aucun'
            }. Vérifiez le champ Sous-axe dans le référentiel fourni avec le canevas.`,
          });
          continue;
        }
        if (reference.axeNumero !== axe.numero) {
          issues.push(
            this.issue('INVALID_SUB_AXIS_PARENT', sousAxe.source.location)
          );
          continue;
        }
        const key = `sous-axe:${reference.numero}`;
        const existing = axes.get(key);
        if (existing) existing.sources.push(sousAxe.source);
        else
          axes.set(key, {
            key,
            parentKey: axeKey,
            numero: reference.numero,
            titre: reference.titre,
            sources: [sousAxe.source],
          });
      }
    }
    if (issues.length) return failure(issues);
    result.axes = [...axes.values()];
    return success(result);
  }

  private static addNumberedAxe(
    axes: Map<string, ResolvedElectrificationAxe>,
    reference: ElectrificationConfig['axes'][number],
    source: ImportSource
  ): string {
    const key = `axe:${reference.numero}`;
    const existing = axes.get(key);
    if (existing) existing.sources.push(source);
    else
      axes.set(key, {
        key,
        parentKey: null,
        numero: String(reference.numero),
        titre: `Axe ${reference.numero}. ${reference.titre}`,
        sources: [source],
      });
    return key;
  }

  /** Inclure les enfants même si leur parent ne pourra pas être résolu. */
  static validateSources(
    input: ElectrificationEngagementsInput,
    additionalSources: ImportSource[] = []
  ): ElectrificationIssue[] {
    const sources = [
      ...input.engagements.flatMap((e) => [
        e.source,
        ...e.cibles.map((c) => c.source),
      ]),
      ...input.axes.flatMap((a) => [
        a.source,
        ...a.sousAxes.map((s) => s.source),
      ]),
      ...additionalSources,
    ];
    const sourceKeys = new Set<string>();
    const issues: ElectrificationIssue[] = [];
    for (const source of sources) {
      if (sourceKeys.has(source.key)) {
        issues.push(this.issue('DUPLICATE_SOURCE_KEY', source.location));
      }
      sourceKeys.add(source.key);
    }
    return issues;
  }

  static validateCatalogue(
    catalogue: ElectrificationConfig
  ): ElectrificationIssue[] {
    return ElectrificationCatalogueRules.asConfigurationIssues(
      ElectrificationCatalogueRules.validateStructure(catalogue)
    );
  }

  private static issue = electrificationEngagementsIssue;
}
