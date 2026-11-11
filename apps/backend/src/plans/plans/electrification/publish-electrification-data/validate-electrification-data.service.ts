import { Injectable } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  ElectrificationConfig,
  electrificationConfigSchema,
  ElectrificationLaureatsConfig,
  electrificationLaureatsConfigSchema,
} from '@tet/domain/plans';
import { and, inArray, isNull } from 'drizzle-orm';
import {
  ElectrificationCatalogueRules,
  IndicateurReference,
} from './electrification-catalogue.rules';
import { ElectrificationLaureatsRules } from './electrification-laureats.rules';
import {
  ElectrificationDataIssue,
  PublishElectrificationDataInput,
} from './publish-electrification-data.input';

type ValidatedData =
  | { kind: 'catalogue'; data: ElectrificationConfig }
  | { kind: 'laureats'; data: ElectrificationLaureatsConfig };

/** Contrôles communs aux publications administratives et au workflow Grist. */
@Injectable()
export class ValidateElectrificationDataService {
  constructor(private readonly database: DatabaseService) {}

  private zodIssues(error: {
    issues: ReadonlyArray<{
      path: ReadonlyArray<PropertyKey>;
      message: string;
    }>;
  }): ElectrificationDataIssue[] {
    return error.issues.map(({ path, message }) => ({
      location: path.join('.'),
      message,
    }));
  }

  async validate(
    input: PublishElectrificationDataInput
  ): Promise<Result<ValidatedData, ElectrificationDataIssue[]>> {
    if (input.kind === 'catalogue') {
      const parsed = electrificationConfigSchema.safeParse(input.data);
      if (!parsed.success) return failure(this.zodIssues(parsed.error));
      const issues = await this.validateCatalogue(parsed.data);
      return issues.length
        ? failure(issues)
        : success({ kind: input.kind, data: parsed.data });
    }
    const parsed = electrificationLaureatsConfigSchema.safeParse(input.data);
    if (!parsed.success) return failure(this.zodIssues(parsed.error));
    const issues = await this.validateLaureats(parsed.data);
    return issues.length
      ? failure(issues)
      : success({ kind: input.kind, data: parsed.data });
  }

  private async validateCatalogue(
    catalogue: ElectrificationConfig
  ): Promise<ElectrificationDataIssue[]> {
    const issues: ElectrificationDataIssue[] = [
      ...ElectrificationCatalogueRules.validateStructure(catalogue),
      ...ElectrificationCatalogueRules.validateFiches(catalogue),
    ];
    if (!ElectrificationCatalogueRules.isValid(catalogue) && !issues.length) {
      issues.push({
        location: 'catalogue',
        message:
          'Le catalogue doit contenir tous les engagements et les listes des sous-axes, actions et indicateurs.',
      });
    }
    if (issues.length) return issues;

    const references =
      ElectrificationCatalogueRules.getValidatedIndicateurReferences(catalogue);
    return this.validateIndicateurs(references);
  }

  private async validateIndicateurs(
    references: IndicateurReference[]
  ): Promise<ElectrificationDataIssue[]> {
    const identifiers = [
      ...new Set(
        references.flatMap(({ identifiantReferentiel }) =>
          identifiantReferentiel === null ? [] : [identifiantReferentiel]
        )
      ),
    ];
    const definitions = identifiers.length
      ? await this.database.db
          .select({
            identifiantReferentiel:
              indicateurDefinitionTable.identifiantReferentiel,
            unite: indicateurDefinitionTable.unite,
            periodicite: indicateurDefinitionTable.periodicite,
          })
          .from(indicateurDefinitionTable)
          .where(
            and(
              inArray(
                indicateurDefinitionTable.identifiantReferentiel,
                identifiers
              ),
              isNull(indicateurDefinitionTable.collectiviteId),
              isNull(indicateurDefinitionTable.groupementId)
            )
          )
      : [];
    return ElectrificationCatalogueRules.validateIndicateurDefinitions(
      references,
      definitions
    );
  }

  private async validateLaureats(
    config: ElectrificationLaureatsConfig
  ): Promise<ElectrificationDataIssue[]> {
    const error = ElectrificationLaureatsRules.validate(config);
    if (error === 'INVALID_ELECTRIFICATION_LAUREATS_CONFIG') {
      return [
        {
          location: 'validUntil',
          message: 'La date de fin doit être postérieure à la date de début.',
        },
      ];
    }
    if (error === 'AMBIGUOUS_ELECTRIFICATION_LAUREATS_CONFIG') {
      return [
        {
          location: 'laureats',
          message:
            'Chaque référence de lauréat et chaque collectivité doivent être uniques.',
        },
      ];
    }
    if (!config.laureats.length) return [];
    const rows = await this.database.db
      .select({ id: collectiviteTable.id })
      .from(collectiviteTable)
      .where(
        inArray(
          collectiviteTable.id,
          config.laureats.map(({ collectiviteId }) => collectiviteId)
        )
      );
    const knownIds = new Set(rows.map(({ id }) => id));
    return config.laureats.flatMap(({ collectiviteId }, index) =>
      knownIds.has(collectiviteId)
        ? []
        : [
            {
              location: `laureats[${index}].collectiviteId`,
              message: `La collectivité ${collectiviteId} n'existe pas dans TeT.`,
            },
          ]
    );
  }
}
