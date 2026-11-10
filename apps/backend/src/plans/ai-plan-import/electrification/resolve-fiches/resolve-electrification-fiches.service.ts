import { Inject, Injectable, Logger } from '@nestjs/common';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { electrificationConfigSchema } from '@tet/domain/plans';
import { ELECTRIFICATION_CONFIG } from '../electrification.constants';
import { ElectrificationIssue } from '../electrification-issue';
import { ResolveElectrificationEngagementsService } from '../resolve-engagements/resolve-electrification-engagements.service';
import { ResolveImportReferenceService } from '../../resolve-import-reference/resolve-import-reference.service';
import { ImportReferenceRules } from '../../resolve-import-reference/import-reference.rules';
import { PrepareFicheRules } from '../../prepare-fiche/prepare-fiche.rules';
import { ElectrificationFichesErrors as Errors } from './electrification-fiches.errors';
import {
  ElectrificationFichesInput,
  ElectrificationIndicateurInput,
  PreparedElectrificationFiche,
  resolveElectrificationFichesInputSchema,
  ResolvedElectrificationFiches,
} from './electrification-fiches.schema';
import { ResolveElectrificationFichesRules as Rules } from './resolve-electrification-fiches.rules';
import { ResolveElectrificationIndicateursService } from './resolve-electrification-indicateurs.service';

/** Résolution sans écriture : les liens existants ne transportent aucun champ à modifier. */
@Injectable()
export class ResolveElectrificationFichesService {
  private readonly logger = new Logger(
    ResolveElectrificationFichesService.name
  );
  constructor(
    @Inject(ELECTRIFICATION_CONFIG) private readonly config: unknown,
    private readonly engagements: ResolveElectrificationEngagementsService,
    private readonly references: ResolveImportReferenceService,
    private readonly indicateurs: ResolveElectrificationIndicateursService
  ) {}

  async resolve(
    input: ElectrificationFichesInput,
    context: ServiceSecondArg
  ): Promise<Result<ResolvedElectrificationFiches, ElectrificationIssue[]>> {
    const parsed = resolveElectrificationFichesInputSchema.safeParse(input);
    if (!parsed.success)
      return failure(
        parsed.error.issues.map(({ path }) =>
          Errors.issue('INVALID_FICHES_INPUT', path.join('.'))
        )
      );
    const { fiches, ...draft } = parsed.data;
    // Ce service valide aussi les droits, le catalogue/version et la structure A/B.
    const structure = await this.engagements.resolve(draft, context);
    if (!structure.success) return structure;
    const config = electrificationConfigSchema.safeParse(this.config);
    if (!config.success)
      return failure([Errors.issue('INVALID_FICHES_CONFIG')]);
    const issues = [
      ...Rules.validateConfig(config.data),
      ...Rules.validateSources(parsed.data),
    ];
    if (issues.length) return failure(issues);
    const result: ResolvedElectrificationFiches = {
      ...structure.data,
      fiches: [],
    };
    try {
      for (const fiche of fiches) {
        const issue = (code: Parameters<typeof Errors.issue>[0]) =>
          issues.push(Errors.issue(code, fiche.source.location));
        const axe = structure.data.axes.find((a) =>
          a.sources.some((s) => s.key === fiche.axeSourceKey)
        );
        if (!axe) {
          issue('INVALID_FICHE_AXIS');
          continue;
        }
        const common = {
          key: `fiche:${fiche.source.key}`,
          axeKey: axe.key,
          source: fiche.source,
        };
        if (
          fiche.reference &&
          ImportReferenceRules.isUrlReference(fiche.reference)
        ) {
          const reference = await this.references.resolveFiche(
            fiche.reference,
            draft.collectiviteId,
            context
          );
          if (!reference.success)
            issues.push(
              ...reference.error.map((error) => ({
                ...error,
                location: fiche.source.location,
              }))
            );
          else {
            result.fiches.push({
              ...common,
              mode: 'link',
              ficheId: reference.data.ficheId,
            });
            issue('EXISTING_FICHE_PRESERVED');
          }
          continue;
        }
        const actions = config.data.fiches.actions;
        const mapping = actions?.find(
          (action) => action.code === fiche.reference
        );
        if (
          fiche.reference &&
          (actions === null || mapping?.validation === 'pending')
        ) {
          issue('FICHES_CONFIG_UNAVAILABLE');
          continue;
        }
        if (fiche.reference && !mapping) {
          issue('UNKNOWN_FICHE_REFERENCE');
          continue;
        }
        if (mapping && !Rules.matchesAxe(mapping, axe, structure.data.axes)) {
          issue('INVALID_FICHE_AXIS');
          continue;
        }
        const documents = Rules.resolveDocuments(
          mapping?.aides ?? [],
          fiche.source.location
        );
        if (!documents.success) {
          issues.push(...documents.error);
          continue;
        }
        const sousActions = Rules.resolveSousActions(
          fiche,
          mapping,
          actions !== null
        );
        if (!sousActions.success) {
          issues.push(...sousActions.error);
          continue;
        }
        const preparation = PrepareFicheRules.prepare({
          source: fiche.source,
          axeKey: axe.key,
          code: fiche.reference,
          champs: fiche.champs,
          defaults: mapping?.champs ?? {},
          sousActions: sousActions.data,
          complements: mapping?.sousActions ?? [],
        });
        if (!preparation.success) {
          issues.push(...preparation.error);
          continue;
        }
        const prepared: PreparedElectrificationFiche & { mode: 'create' } = {
          ...preparation.data,
          indicateurs: [],
          documents: documents.data,
        };
        const seen = new Set<string>();
        const indicateurs = [...fiche.indicateurs];
        for (const indicateur of indicateurs) {
          if (
            indicateur.reference &&
            !ImportReferenceRules.isUrlReference(indicateur.reference) &&
            seen.has(indicateur.reference)
          )
            issues.push(
              Errors.issue(
                'DUPLICATE_FICHE_REFERENCE',
                indicateur.source.location
              )
            );
          if (indicateur.reference) seen.add(indicateur.reference);
        }
        for (const code of mapping?.indicateurCodes ?? []) {
          if (seen.has(code)) continue;
          const definition = config.data.fiches.indicateurs?.find(
            (i) => i.code === code
          );
          if (!definition) {
            issue('INVALID_FICHES_CONFIG');
            continue;
          }
          const source = {
            key: `catalogue:${fiche.source.key}:${code}`,
            location: fiche.source.location,
          };
          const complement: ElectrificationIndicateurInput =
            definition.type === 'quantitatif'
              ? {
                  source,
                  reference: code,
                  type: 'quantitatif',
                  titre: code,
                  unite: null,
                  periodicite: null,
                  resultat: { valeur: null, periode: null },
                  objectif: { valeur: null, periode: null },
                }
              : {
                  source,
                  reference: code,
                  type: 'booleen',
                  titre: definition.titre,
                  resultat: null,
                  objectif: null,
                  anneeResultat: null,
                  anneeObjectif: null,
                };
          indicateurs.push(complement);
        }
        const resolution = await this.indicateurs.resolveAll(
          indicateurs,
          config.data,
          draft.collectiviteId,
          context
        );
        if (!resolution.success) issues.push(...resolution.error);
        else {
          prepared.indicateurs.push(...resolution.data.indicateurs);
          issues.push(...resolution.data.issues);
        }
        result.fiches.push(prepared);
      }
    } catch (error) {
      this.logger.error(
        'Impossible de résoudre les références des fiches actions Électrification',
        error
      );
      return failure([Errors.issue('FICHE_RESOLUTION_FAILED')]);
    }
    if (
      issues.some(({ kind }) => kind !== 'warning' && kind !== 'preserved-data')
    )
      return failure(issues);
    result.report.issues.push(...issues);
    return success(result);
  }
}
