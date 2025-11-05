import { preuveActionTable } from '@/backend/collectivites/documents/models/preuve-action.table';
import { preuveReglementaireDefinitionTable } from '@/backend/collectivites/documents/models/preuve-reglementaire-definition.table';
import { ImportActionDefinitionType } from '@/backend/referentiels/import-referentiel/import-action-definition.dto';
import { buildConflictUpdateColumns } from '@/backend/utils/database/conflict.utils';
import { DatabaseService } from '@/backend/utils/database/database.service';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import SheetService from '@/backend/utils/google-sheets/sheet.service';
import { PreuveReglementaireDefinition } from '@/domain/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ilike } from 'drizzle-orm';
import {
  ImportPreuveReglementaireDefinition,
  importPreuveReglementaireDefinitionSchema,
} from './import-preuve-reglementaire-definition.dto';

@Injectable()
export default class ImportPreuveReglementaireDefinitionService {
  readonly logger = new Logger(ImportPreuveReglementaireDefinitionService.name);

  private readonly PREUVE_REGLEMENTAIRE_DEFINITIONS_SPREADSHEET_RANGE =
    'Preuves réglementaires!A:D';

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly sheetService: SheetService
  ) {}

  async importPreuveReglementaireDefinitionsAndActionRelations(
    referentielId: ReferentielId,
    spreadsheetId: string,
    actions: ImportActionDefinitionType[],
    tx: Transaction
  ): Promise<{
    definitions: PreuveReglementaireDefinition[];
  }> {
    const { data: preuveDefinitions } =
      await this.getPreuveReglementaireDefinitions(spreadsheetId);
    this.logger.log(
      `Found ${preuveDefinitions.length} preuve reglementaire definitions in spreadsheet ${spreadsheetId}`
    );

    this.verifyReferentielPreuveReglementaireDefinitionsAndActionRelationsWithData(
      referentielId,
      actions,
      preuveDefinitions
    );

    const upsertedPreuveDefinitions =
      await this.upsertPreuveReglementaireDefinitionsAndActionRelations(
        referentielId,
        preuveDefinitions,
        tx
      );

    return {
      definitions: upsertedPreuveDefinitions,
    };
  }

  async getPreuveReglementaireDefinitions(spreadsheetId: string) {
    return this.sheetService.getDataFromSheet<ImportPreuveReglementaireDefinition>(
      spreadsheetId,
      importPreuveReglementaireDefinitionSchema,
      this.PREUVE_REGLEMENTAIRE_DEFINITIONS_SPREADSHEET_RANGE,
      ['id'],
      {
        description: '',
      }
    );
  }

  async verifyReferentielPreuveReglementaireDefinitionsAndActionRelations(
    referentielId: ReferentielId,
    spreadsheetId: string,
    actions: ImportActionDefinitionType[]
  ): Promise<void> {
    const { data: preuveDefinitions } =
      await this.getPreuveReglementaireDefinitions(spreadsheetId);

    this.verifyReferentielPreuveReglementaireDefinitionsAndActionRelationsWithData(
      referentielId,
      actions,
      preuveDefinitions
    );
  }

  verifyReferentielPreuveReglementaireDefinitionsAndActionRelationsWithData(
    referentielId: ReferentielId,
    actions: ImportActionDefinitionType[],
    preuveDefinitions: ImportPreuveReglementaireDefinition[]
  ) {
    const preuveDefinitionsMap = new Map<
      string,
      ImportPreuveReglementaireDefinition
    >();

    preuveDefinitions.forEach((preuve) => {
      if (preuveDefinitionsMap.has(preuve.id)) {
        throw new UnprocessableEntityException(
          `Duplicate preuve id ${preuve.id}`
        );
      }
      preuveDefinitionsMap.set(preuve.id, preuve);

      // Validate that referenced actions exist
      if (preuve.actions && preuve.actions.length > 0) {
        preuve.actions.forEach((actionId) => {
          if (
            !actions.find(
              (action) => `${referentielId}_${action.identifiant}` === actionId
            )
          ) {
            throw new UnprocessableEntityException(
              `Invalid action reference ${actionId} for preuve ${preuve.id}`
            );
          }
        });
      }
    });
  }

  private async upsertPreuveReglementaireDefinitionsAndActionRelations(
    referentielId: ReferentielId,
    preuveDefinitions: ImportPreuveReglementaireDefinition[],
    tx: Transaction
  ): Promise<PreuveReglementaireDefinition[]> {
    const preuveDefinitionsToCreate = preuveDefinitions.map(
      ({ actions, ...preuve }) => preuve
    );

    this.logger.log(
      `Upserting ${preuveDefinitionsToCreate.length} preuve reglementaire definitions with action relations in a transaction`
    );

    // Upsert preuve definitions
    if (preuveDefinitionsToCreate.length > 0) {
      await tx
        .insert(preuveReglementaireDefinitionTable)
        .values(preuveDefinitionsToCreate)
        .onConflictDoUpdate({
          target: [preuveReglementaireDefinitionTable.id],
          set: buildConflictUpdateColumns(preuveReglementaireDefinitionTable, [
            'nom',
            'description',
          ]),
        })
        .returning();
    }

    // Create action relations
    const preuveActionValues: Array<{
      preuveId: string;
      actionId: string;
    }> = [];

    preuveDefinitions.forEach((preuve) => {
      preuve.actions?.forEach((actionId) => {
        preuveActionValues.push({
          preuveId: preuve.id,
          actionId: actionId,
        });
      });
    });

    this.logger.log(
      `Recreating ${preuveActionValues.length} preuve-action relations`
    );

    // Delete existing relations
    await tx
      .delete(preuveActionTable)
      .where(ilike(preuveActionTable.actionId, `${referentielId}%`));

    // Insert new relations
    if (preuveActionValues.length > 0) {
      await tx.insert(preuveActionTable).values(preuveActionValues);
    }

    return preuveDefinitionsToCreate;
  }
}
