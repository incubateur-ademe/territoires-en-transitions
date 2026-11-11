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
import { ElectrificationEngagementCodeEnum as EngagementCode } from '@tet/domain/plans';
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
    const structure = ResolveElectrificationStructureRules.resolve(
      draft,
      catalogue.data
    );
    if (!structure.success) return structure;

    const expected = draft.engagements.flatMap((engagement) => {
      const definition = catalogue.data.engagements.find(
        ({ code }) => code === engagement.code
      );
      assert(definition); // La structure a déjà validé chaque code.
      return definition.cibles.map((cible) => ({ engagement, cible }));
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
    for (const { engagement, cible } of expected) {
      const extracted = engagement.cibles.find(({ key }) => key === cible.key);
      const source = extracted?.source ?? engagement.source;
      const issue = (code: ElectrificationEngagementsErrorCode) =>
        issues.push(electrificationEngagementsIssue(code, source.location));
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
      if (extracted?.unite != null && extracted.unite !== cible.unite) {
        issue('INVALID_ENGAGEMENT_UNIT');
      }
      if (
        (extracted?.valeur != null &&
          (extracted.unite === null || extracted.annee === null)) ||
        (extracted?.annee != null && extracted.annee !== 2030)
      ) {
        issue('INVALID_ENGAGEMENT_PERIOD');
      }
      if (
        extracted?.valeur != null &&
        (extracted.valeur < 0 ||
          (cible.unite === '%' && extracted.valeur > 100))
      ) {
        issue('INVALID_ENGAGEMENT_VALUE');
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
          IndicateurPeriodes.parse('annuelle', '2030')
        ),
        objectif: extracted?.valeur ?? null,
        source,
      });
    }
    const bornesRecharge = draft.engagements.find(
      ({ code }) => code === EngagementCode.BORNES_RECHARGE_PUBLIQUES
    );
    const total = bornesRecharge?.cibles.find(
      ({ key }) => key === 'total'
    )?.valeur;
    const rapides = bornesRecharge?.cibles.find(({ key }) => key === 'rapides');
    if (total != null && rapides?.valeur != null && rapides.valeur > total) {
      issues.push(
        electrificationEngagementsIssue(
          'INCONSISTENT_E07_TARGETS',
          rapides.source.location
        )
      );
    }
    if (issues.some(({ kind }) => kind !== 'warning')) return failure(issues);
    structure.data.report.issues.push(...issues);
    return success(structure.data);
  }
}
