import { ElectrificationDataService } from '@tet/backend/plans/plans/electrification/publish-electrification-data/electrification-data.service';
import { Injectable, Logger } from '@nestjs/common';
import { ListIndicateursService } from '@tet/backend/indicateurs/indicateurs/list-indicateurs/list-indicateurs.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  IndicateurDetaille,
  IndicateurPeriodes,
} from '@tet/domain/indicateurs';
import { ReadElectrificationV4Snapshot } from '@tet/backend/plans/plans/electrification/config/read-electrification-v4-snapshot';
import { ResourceType } from '@tet/domain/users';
import assert from 'node:assert';
import {
  ElectrificationEngagementsErrorCode,
  electrificationEngagementsIssue,
} from './electrification-engagements.errors';
import {
  ElectrificationEngagementsInput,
  ResolvedElectrificationEngagements,
  resolveElectrificationEngagementsInputSchema,
} from './electrification-engagements.schema';
import { ElectrificationIssue } from '../electrification-issue';
import { ElectrificationImportLocations } from '../electrification-import-locations';
import { ResolveElectrificationStructureRules } from './resolve-electrification-structure.rules';

/** Prépare uniquement des identités et des cibles ; aucune écriture métier. */
@Injectable()
export class ResolveElectrificationEngagementsService {
  private readonly logger = new Logger(
    ResolveElectrificationEngagementsService.name
  );

  constructor(
    private readonly data: ElectrificationDataService,
    private readonly permissions: PermissionService,
    private readonly indicateurs: ListIndicateursService
  ) {}

  async resolve(
    input: ElectrificationEngagementsInput,
    { user }: ServiceSecondArg
  ): Promise<
    Result<ResolvedElectrificationEngagements, ElectrificationIssue[]>
  > {
    const parsed =
      resolveElectrificationEngagementsInputSchema.safeParse(input);
    if (!parsed.success) {
      return failure(
        parsed.error.issues.map(({ path }) =>
          electrificationEngagementsIssue(
            'INVALID_ELECTRIFICATION_INPUT',
            path.join('.')
          )
        )
      );
    }
    const draft = parsed.data;
    const permission = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId: draft.collectiviteId }
    );
    if (!permission.success) {
      return failure([electrificationEngagementsIssue('UNAUTHORIZED')]);
    }

    // Une configuration incomplète ne doit empêcher ni le démarrage ni l'import générique.
    const catalogue = await this.data.getCatalogue(draft.catalogueVersion);
    if (
      !catalogue.success ||
      catalogue.data.version !== draft.catalogueVersion
    ) {
      return failure([
        electrificationEngagementsIssue(
          'UNSUPPORTED_ELECTRIFICATION_CATALOGUE'
        ),
      ]);
    }
    const config = ReadElectrificationV4Snapshot.adapt(catalogue.data);
    const structure = ResolveElectrificationStructureRules.resolve(
      draft,
      config
    );
    if (!structure.success) return structure;

    const expected = draft.engagements.flatMap((engagement) => {
      const definition = config.engagements.find(
        ({ code }) => code === engagement.code
      );
      assert(definition); // La structure a déjà validé chaque code.
      return definition.cibles.map((cible) => ({
        engagement,
        definition,
        cible,
      }));
    });
    if (!expected.length) return structure;

    let definitions: IndicateurDetaille[];
    try {
      const identifiantsReferentiel = [
        ...new Set(
          expected.flatMap(({ cible }) =>
            cible.identifiantReferentiel === null
              ? []
              : [cible.identifiantReferentiel]
          )
        ),
      ];
      const result = identifiantsReferentiel.length
        ? await this.indicateurs.listIndicateurs(
            {
              collectiviteId: draft.collectiviteId,
              filters: { identifiantsReferentiel },
              queryOptions: { page: 1, limit: identifiantsReferentiel.length },
            },
            user
          )
        : null;
      definitions = result?.data ?? [];
    } catch (error) {
      this.logger.error(
        'Impossible de résoudre les indicateurs des engagements Électrification',
        error
      );
      return failure([
        electrificationEngagementsIssue('INDICATEUR_RESOLUTION_FAILED'),
      ]);
    }

    const issues: ElectrificationIssue[] = [];
    for (const {
      engagement,
      definition: engagementDefinition,
      cible,
    } of expected) {
      const extracted = engagement.cibles.find(({ key }) => key === cible.key);
      const rules = cible.reglesImport;
      if (!rules)
        return failure([
          electrificationEngagementsIssue('INVALID_ENGAGEMENT_MAPPING'),
        ]);
      const source = extracted?.source ?? engagement.source;
      const location = ElectrificationImportLocations.field(
        source.location,
        cible.libelleSource ??
          (engagementDefinition.cibles.length > 1 ? cible.key : undefined)
      );
      const issue = (code: ElectrificationEngagementsErrorCode) =>
        issues.push(electrificationEngagementsIssue(code, location));
      if (
        cible.validation !== 'validated' ||
        cible.periodicite === null ||
        cible.identifiantReferentiel === null ||
        cible.unite === null
      ) {
        issue('UNVALIDATED_ENGAGEMENT_INDICATEUR');
        continue;
      }
      const matches = definitions.filter(
        ({ identifiantReferentiel }) =>
          identifiantReferentiel === cible.identifiantReferentiel
      );
      const definition = matches[0];
      if (matches.length !== 1) {
        issue('MISSING_ENGAGEMENT_INDICATEUR');
        continue;
      }
      if (
        cible.periodicite !== 'annuelle' ||
        definition.periodicite !== cible.periodicite ||
        definition.unite !== cible.unite
      ) {
        issue('INCOMPATIBLE_ENGAGEMENT_INDICATEUR');
        continue;
      }
      if (
        extracted?.unite != null &&
        extracted.unite !== cible.unite &&
        extracted.unite !== (cible.uniteImport ?? cible.unite)
      ) {
        issue('INVALID_ENGAGEMENT_UNIT');
      }
      if (
        (extracted?.valeur != null &&
          (extracted.unite === null || extracted.annee === null)) ||
        (extracted?.annee != null && extracted.annee !== rules.annee)
      ) {
        issue('INVALID_ENGAGEMENT_PERIOD');
      }
      if (
        extracted?.valeur != null &&
        ((rules.minimum !== null && extracted.valeur < rules.minimum) ||
          (rules.maximum !== null && extracted.valeur > rules.maximum))
      ) {
        issue('INVALID_ENGAGEMENT_VALUE');
      }
      const plafond = engagement.cibles.find(
        ({ key }) => key === rules.plafondCible
      );
      if (
        extracted?.valeur != null &&
        plafond?.valeur != null &&
        extracted.valeur > plafond.valeur
      ) {
        issue('INCONSISTENT_ENGAGEMENT_TARGETS');
      }
      if (extracted?.valeur == null) {
        issue('EMPTY_ENGAGEMENT_TARGET');
      }
      const resolvedEngagement = structure.data.engagements.find(
        ({ code }) => code === engagement.code
      );
      assert(resolvedEngagement);
      structure.data.cibles.push({
        key: `engagement:${engagement.code}:${cible.key}`,
        engagementCode: engagement.code,
        axeKey: resolvedEngagement.axeKey,
        indicateurId: definition.id,
        identifiantReferentiel: cible.identifiantReferentiel,
        unite: cible.unite,
        periodicite: 'annuelle',
        dateValeur: IndicateurPeriodes.toDateValeur(
          IndicateurPeriodes.parse('annuelle', String(rules.annee))
        ),
        objectif: extracted?.valeur ?? null,
        source,
      });
    }
    if (issues.some(({ kind }) => kind !== 'warning')) return failure(issues);
    structure.data.report.issues.push(...issues);
    return success(structure.data);
  }
}
