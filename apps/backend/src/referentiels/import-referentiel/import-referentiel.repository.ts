import { Injectable, Logger } from '@nestjs/common';
import { personnalisationRegleTable } from '@tet/backend/collectivites/personnalisations/models/personnalisation-regle.table';
import {
  CreateIndicateurActionType,
  indicateurActionTable,
} from '@tet/backend/indicateurs/definitions/indicateur-action.table';
import ImportPreuveReglementaireDefinitionService from '@tet/backend/referentiels/import-preuve-reglementaire-definitions/import-preuve-reglementaire-definition.service';
import { ImportActionDefinitionType } from '@tet/backend/referentiels/import-referentiel/import-action-definition.dto';
import { actionRelationTable } from '@tet/backend/referentiels/models/action-relation.table';
import { questionActionTable } from '@tet/backend/referentiels/models/question-action.table';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { PersonnalisationRegleCreate } from '@tet/domain/collectivites';
import {
  ActionDefinitionCreate,
  ActionDefinitionTag,
  ActionOrigine,
  ActionQuestion,
  ActionRelationCreate,
  ReferentielDefinition,
  ReferentielId,
  ReferentielIdEnum,
  ReferentielTag,
} from '@tet/domain/referentiels';
import { eq, ilike, like } from 'drizzle-orm';
import { actionOrigineTable } from '../correlated-actions/action-origine.table';
import { actionDefinitionTagTable } from '../models/action-definition-tag.table';
import { actionDefinitionTable } from '../models/action-definition.table';
import { referentielDefinitionTable } from '../models/referentiel-definition.table';
import { referentielTagTable } from '../models/referentiel-tag.table';
import { ImportActionDefinitionCoremeasureType } from './import-action-definition.dto';
import { ReferentielLabelEnum } from '../models/referentiel-label.enum';

export type SaveReferentielInput = {
  referentielId: ReferentielId;
  spreadsheetId: string;
  actionRelations: ActionRelationCreate[];
  actionDefinitions: ActionDefinitionCreate[];
  actionOrigines: ActionOrigine[];
  actionTags: ActionDefinitionTag[];
  personnalisationRegles: PersonnalisationRegleCreate[];
  questionActionRelations: ActionQuestion[];
  indicateurActions: CreateIndicateurActionType[];
  referentielDefinition: ReferentielDefinition;
  importActionDefinitions: ImportActionDefinitionType[];
};

@Injectable()
export class ImportReferentielRepository {
  readonly logger = new Logger(ImportReferentielRepository.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly importPreuveReglementaireDefinitionService: ImportPreuveReglementaireDefinitionService
  ) {}

  async saveReferentiel(input: SaveReferentielInput): Promise<void> {
    const {
      referentielId,
      spreadsheetId,
      actionRelations,
      actionDefinitions,
      actionOrigines,
      actionTags,
      personnalisationRegles,
      questionActionRelations,
      indicateurActions,
      referentielDefinition,
      importActionDefinitions,
    } = input;

    await this.database.db.transaction(async (tx) => {
      await tx
        .insert(actionRelationTable)
        .values(actionRelations)
        .onConflictDoNothing();

      const columnsToUpdate = [
        'nom',
        'description',
        'categorie',
        'contexte',
        'exemples',
        'ressources',
        'reductionPotentiel',
        'perimetreEvaluation',
        'preuve',
        'referentielVersion',
        'exprScore',
        'points',
        'pourcentage',
      ];

      await tx
        .insert(actionDefinitionTable)
        .values(actionDefinitions)
        .onConflictDoUpdate({
          target: [actionDefinitionTable.actionId],
          set: buildConflictUpdateColumns(
            actionDefinitionTable,
            columnsToUpdate as any
          ),
        });

      await tx
        .delete(actionOrigineTable)
        .where(eq(actionOrigineTable.referentielId, referentielId));

      if (actionOrigines.length) {
        await tx.insert(actionOrigineTable).values(actionOrigines);
      }

      // Delete & recreate tags
      await tx
        .delete(actionDefinitionTagTable)
        .where(eq(actionDefinitionTagTable.referentielId, referentielId));

      if (actionTags.length) {
        await tx.insert(actionDefinitionTagTable).values(actionTags);
      }

      // Delete personnalisation rules
      await tx.delete(personnalisationRegleTable).where(
        like(personnalisationRegleTable.actionId, `${referentielId}_%`)
      );

      // Create personnalisation rules
      if (personnalisationRegles.length) {
        await tx
          .insert(personnalisationRegleTable)
          .values(personnalisationRegles)
          .onConflictDoUpdate({
            target: [
              personnalisationRegleTable.actionId,
              personnalisationRegleTable.type,
            ],
            set: buildConflictUpdateColumns(personnalisationRegleTable, [
              'formule',
              'description',
            ]),
          });
      }

      // relations action personnalisation question (derived from expressions)
      this.logger.log(
        `Recreating ${questionActionRelations.length} personnalisation question action relations (derived from expressions)`
      );
      await tx
        .delete(questionActionTable)
        .where(ilike(questionActionTable.actionId, `${referentielId}_%`));
      if (questionActionRelations.length) {
        await tx
          .insert(questionActionTable)
          .values(questionActionRelations);
      }

      // relations action indicateur
      this.logger.log(
        `Recreating ${indicateurActions.length} indicateur action relations`
      );
      await tx
        .delete(indicateurActionTable)
        .where(ilike(indicateurActionTable.actionId, `${referentielId}_%`));
      if (indicateurActions.length) {
        await tx.insert(indicateurActionTable).values(indicateurActions);
      }

      await tx
        .insert(referentielDefinitionTable)
        .values(referentielDefinition)
        .onConflictDoUpdate({
          target: [referentielDefinitionTable.id],
          set: buildConflictUpdateColumns(referentielDefinitionTable, [
            'version',
          ]),
        });

      await this.importPreuveReglementaireDefinitionService.importPreuveReglementaireDefinitionsAndActionRelations(
        referentielId,
        spreadsheetId,
        importActionDefinitions,
        tx
      );
    });
  }

  async getExistingActionIds(): Promise<string[]> {
    return (
      await this.database.db
        .select({
          action_id: actionRelationTable.id,
        })
        .from(actionRelationTable)
    ).map((action) => action.action_id);
  }

  async createReferentielTagsIfNeeded(): Promise<void> {
    const referentielTags: ReferentielTag[] = [
      {
        ref: ReferentielIdEnum.CAE,
        nom: 'CAE',
        type: 'Catalogue',
      },
      {
        ref: ReferentielIdEnum.ECI,
        nom: 'ECI',
        type: 'Catalogue',
      },
      {
        ref: ImportActionDefinitionCoremeasureType.COREMEASURE,
        nom: 'EEA Coremeasure',
        type: 'EEA',
      },
      {
        ref: ReferentielLabelEnum.TE_ECI,
        nom: 'Label TE ECI',
        type: 'Label',
      },
      {
        ref: ReferentielLabelEnum.TE_CAE,
        nom: 'Label TE CAE',
        type: 'Label',
      },
    ];

    await this.database.db
      .insert(referentielTagTable)
      .values(referentielTags)
      .onConflictDoNothing();
  }
}
