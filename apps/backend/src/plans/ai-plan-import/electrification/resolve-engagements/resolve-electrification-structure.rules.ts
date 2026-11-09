import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ElectrificationConfig, StatutEnum } from '@tet/domain/plans';
import { ImportSource } from '../../models/import-source.schema';
import {
  ElectrificationEngagementsErrorCode,
  electrificationEngagementsErrors,
} from './electrification-engagements.errors';
import {
  ElectrificationEngagementsInput,
  ElectrificationIssue,
  ResolvedElectrificationAxe,
  ResolvedElectrificationEngagements,
} from './electrification-engagements.schema';

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
          this.issue('DUPLICATE_ENGAGEMENT', engagement.source.location)
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
          issues.push(this.issue('UNKNOWN_AXIS', axe.source.location));
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
        if (catalogue.sousAxes === null) {
          issues.push(
            this.issue(
              'SUB_AXES_CATALOGUE_UNAVAILABLE',
              sousAxe.source.location
            )
          );
          continue;
        }
        const reference = catalogue.sousAxes.find(
          ({ numero }) => numero === sousAxe.numero
        );
        if (!reference) {
          issues.push(this.issue('UNKNOWN_SUB_AXIS', sousAxe.source.location));
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

  private static validateCatalogue(
    catalogue: ElectrificationConfig
  ): ElectrificationIssue[] {
    const issues: ElectrificationIssue[] = [];
    const axeNumeros = new Set<number>();
    catalogue.axes.forEach((axe, index) => {
      if (axeNumeros.has(axe.numero)) {
        issues.push(
          this.issue(
            'DUPLICATE_CATALOGUE_REFERENCE',
            `catalogue.axes[${index}]`
          )
        );
      }
      axeNumeros.add(axe.numero);
    });
    const sousAxeNumeros = new Set<string>();
    catalogue.sousAxes?.forEach((sousAxe, index) => {
      const location = `catalogue.sousAxes[${index}]`;
      if (sousAxeNumeros.has(sousAxe.numero)) {
        issues.push(this.issue('DUPLICATE_CATALOGUE_REFERENCE', location));
      }
      sousAxeNumeros.add(sousAxe.numero);
      if (!axeNumeros.has(sousAxe.axeNumero)) {
        issues.push(this.issue('INVALID_CATALOGUE_PARENT', location));
      }
    });
    const codes = new Set<string>();
    catalogue.engagements.forEach((engagement, index) => {
      const location = `catalogue.engagements[${index}]`;
      if (codes.has(engagement.code)) {
        issues.push(this.issue('DUPLICATE_CATALOGUE_REFERENCE', location));
      }
      codes.add(engagement.code);
      if (!axeNumeros.has(engagement.axeNumero)) {
        issues.push(this.issue('INVALID_CATALOGUE_PARENT', location));
      }
      if ((engagement.actionTitre !== null) === engagement.cibles.length > 0) {
        issues.push(this.issue('INVALID_ENGAGEMENT_MAPPING', location));
      }
      const cibleKeys = new Set<string>();
      const indicateurReferences = new Set<string>();
      engagement.cibles.forEach((cible, cibleIndex) => {
        if (
          cibleKeys.has(cible.key) ||
          indicateurReferences.has(cible.identifiantReferentiel)
        ) {
          issues.push(
            this.issue(
              'DUPLICATE_CATALOGUE_REFERENCE',
              `${location}.cibles[${cibleIndex}]`
            )
          );
        }
        cibleKeys.add(cible.key);
        indicateurReferences.add(cible.identifiantReferentiel);
      });
    });
    return issues;
  }

  private static issue(
    code: ElectrificationEngagementsErrorCode,
    location: string
  ): ElectrificationIssue {
    return { code, ...electrificationEngagementsErrors[code], location };
  }
}
