import { preuveActionTable } from '@/backend/collectivites/documents/models/preuve-action.table';
import {
  CreatePreuveReglementaireDefinitionType,
  preuveReglementaireDefinitionTable,
} from '@/backend/collectivites/documents/models/preuve-reglementaire-definition.table';
import { ImportActionDefinitionType } from '@/backend/referentiels/import-referentiel/import-action-definition.dto';
import { ReferentielId } from '@/backend/referentiels/models/referentiel-id.enum';
import { DatabaseService } from '@/backend/utils';
import { buildConflictUpdateColumns } from '@/backend/utils/database/conflict.utils';
import { Transaction } from '@/backend/utils/database/transaction.utils';
import SheetService from '@/backend/utils/google-sheets/sheet.service';
import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import { eq, ilike, sql } from 'drizzle-orm';
import {
  ImportPreuveReglementaireDefinitionType,
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
    definitions: CreatePreuveReglementaireDefinitionType[];
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
    return this.sheetService.getDataFromSheet<ImportPreuveReglementaireDefinitionType>(
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
    preuveDefinitions: ImportPreuveReglementaireDefinitionType[]
  ) {
    const preuveDefinitionsMap = new Map<
      string,
      ImportPreuveReglementaireDefinitionType
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
    preuveDefinitions: ImportPreuveReglementaireDefinitionType[],
    tx: Transaction
  ): Promise<CreatePreuveReglementaireDefinitionType[]> {
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

  /**
   * Populate spreadsheet with data from database
   */
  async populateSpreadsheetWithDatabase(
    referentielId: ReferentielId,
    spreadsheetId: string
  ) {
    // Get all preuve definitions with their associated actions
    const preuveDefinitionsWithActions = await this.databaseService.db
      .select({
        id: preuveReglementaireDefinitionTable.id,
        nom: sql<string>`MAX(${preuveReglementaireDefinitionTable.nom})`.as(
          'nom'
        ),
        description:
          sql<string>`MAX(${preuveReglementaireDefinitionTable.description})`.as(
            'description'
          ),
        actions:
          sql<string>`string_agg(${preuveActionTable.actionId}, ', ')`.as(
            'actions'
          ),
      })
      .from(preuveReglementaireDefinitionTable)
      .leftJoin(
        preuveActionTable,
        eq(preuveActionTable.preuveId, preuveReglementaireDefinitionTable.id)
      )
      .where(ilike(preuveActionTable.actionId, `${referentielId}%`))
      .groupBy(preuveReglementaireDefinitionTable.id);

    this.logger.log(
      `Found ${preuveDefinitionsWithActions.length} preuve definitions in database`
    );

    const header: string[] = ['id', 'nom', 'actions', 'description'];
    const rowDataToWrite: string[][] = preuveDefinitionsWithActions.map(
      (record) => this.sheetService.getRecordRowToWrite(record, header)
    );

    // Add header as first row
    rowDataToWrite.unshift(header);

    return this.sheetService.overwriteRawDataToSheet(
      spreadsheetId,
      this.PREUVE_REGLEMENTAIRE_DEFINITIONS_SPREADSHEET_RANGE,
      rowDataToWrite
    );
  }
}
