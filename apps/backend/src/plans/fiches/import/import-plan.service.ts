import { Injectable, Logger } from '@nestjs/common';
import { ImportPlanCleanService } from '@tet/backend/plans/fiches/import/import-plan-clean.service';
import { ImportPlanFetchService } from '@tet/backend/plans/fiches/import/import-plan-fetch.service';
import { ImportPlanSaveService } from '@tet/backend/plans/fiches/import/import-plan-save.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { PersonneId, TagEnum, TagType } from '@tet/domain/collectivites';
import ExcelJS from 'exceljs';
import { MutatePlanService } from '../../plans/mutate-plan/mutate-plan.service';
import {
  AxeImport,
  FicheImport,
  ficheTagTypes,
  FinanceurImport,
  MemoryImport,
  PlanImport,
  TagImport,
} from './import-plan.dto';
const FIRST_DATA_ROW = 4; // The first three rows are not data

/** Column names ordered (order is important) */
enum ColumnNames {
  Axe = 'Axe (x)',
  SousAxe = 'Sous-axe (x.x)',
  SousSousAxe = 'Sous-sous axe (x.x.x)',
  TitreFicheAction = 'Titre de la fiche action',
  Descriptif = 'Descriptif',
  InstancesGouvernance = 'Instances de gouvernance',
  Objectifs = 'Objectifs',
  IndicateursLies = 'Indicateurs liés',
  StructurePilote = 'Structure pilote',
  MoyensHumainsTechniques = 'Moyens humains et techniques',
  Partenaires = 'Partenaires',
  DirectionOuServicePilote = 'Direction ou service pilote',
  PersonnePilote = 'Personne pilote',
  EluReferent = 'Élu·e référent·e',
  ParticipationCitoyenne = 'Participation Citoyenne',
  Financements = 'Financements',
  Financeur1 = 'Financeur 1',
  Montant1 = 'Montant € HT',
  Financeur2 = 'Financeur 2',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  Montant2 = 'Montant € HT',
  Financeur3 = 'Financeur 3',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  Montant3 = 'Montant € HT',
  BudgetPrevisionnel = 'Budget prévisionnel total € HT',
  Statut = 'Statut',
  NiveauPriorite = 'Niveau de priorité',
  DateDebut = 'Date de début',
  DateFin = 'Date de fin',
  ActionAmeliorationContinue = 'Action en amélioration continue',
  Calendrier = 'Calendrier',
  ActionsLiees = 'Actions liées',
  FichesPlansLiees = 'Fiches des plans liées',
  Notes = 'Notes',
  EtapesFicheAction = 'Etapes de la fiche action',
  DocumentsLiens = 'Documents et liens',
}

/** Column names ordered in array */
const OrderedColumnNames: string[] = Object.values(ColumnNames);

/** Uses column name comparison instead of indexes to facilitate potential insertion of new columns */
const columnIndexes: Record<ColumnNames, number> = {} as Record<
  ColumnNames,
  number
>;
OrderedColumnNames.forEach((col, index) => {
  columnIndexes[col as ColumnNames] = index;
});

@Injectable()
export class ImportPlanService {
  private readonly logger = new Logger(ImportPlanService.name);
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fetch: ImportPlanFetchService,
    private readonly save: ImportPlanSaveService,
    private readonly clean: ImportPlanCleanService,
    private readonly mutatePlanService: MutatePlanService
  ) {}

  private getDataWorksheet(workbook: ExcelJS.Workbook) {
    for (let i = 0; i < workbook.worksheets.length; i++) {
      const worksheet = workbook.worksheets[i];
      if (worksheet.getCell('A2').value === 'Axe (x)') {
        return worksheet;
      }
    }
    return null;
  }

  /**
   * Import a "plan" from an Excel file
   * @param file
   * @param collectiviteId
   * @param planName
   * @param planType
   */
  async import(
    user: AuthenticatedUser,
    file: string,
    collectiviteId: number,
    planName: string,
    planType?: number,
    pilotes?: PersonneId[],
    referents?: PersonneId[]
  ): Promise<boolean> {
    const plan: PlanImport = {
      nom: planName,
      typeId: planType,
      enfants: new Set<AxeImport>(),
      fiches: [],
      pilotes,
      referents,
    };

    this.logger.log(
      `Début de l'import ${planName} avec le type ${planType} pour la collectivité ${collectiviteId} (${JSON.stringify(
        plan
      )})`
    );

    // Open and check if the file is ok
    const fileBuffer = Buffer.from(file, 'base64');
    const workbook = new ExcelJS.Workbook();
    const errors: string[] = [];

    // Retrieves and creates useful data
    const memoryData = await this.fetchData(collectiviteId);

    await workbook.xlsx.load(fileBuffer);
    const worksheet = this.getDataWorksheet(workbook);
    if (!worksheet) {
      errors.push(`<strong>L'onglet des données n'a pas été trouvé.</strong>`);
    } else {
      const header = worksheet.getRow(2).values as any[];
      header.shift();
      this.checkColumns(worksheet, header);

      // Browse the file and retrieve the data

      const rows: ExcelJS.Row[] = [];
      worksheet.eachRow((row) => {
        rows.push(row);
      });
      for (const row of rows) {
        const rowNumber = row.number;
        if (rowNumber < FIRST_DATA_ROW) continue; // Ignorer the header
        const rowData = row.values as any[];
        rowData.shift(); // data start at [1]
        try {
          await this.createAxes(rowData, plan, memoryData);
        } catch (e) {
          errors.push(`<strong>Ligne ${rowNumber} :</strong> ${e as string}`);
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`<strong>Erreur(s) rencontrée(s) dans le fichier Excel :</strong></br>
      <ul>
      ${errors.map((error) => `<li>${error}</li>`).join('')}
      </ul>
      <br><br>
      Merci de la/les corriger avant de retenter un import.`);
    }

    // Save datas
    try {
      await this.saveData(collectiviteId, user, memoryData, plan);
    } catch (e) {
      throw new Error(`<strong>Erreur rencontrée lors de la sauvegarde.</strong></br>
      Merci de contacter un dev en fournissant l'erreur ci-dessous :<br><br>

            ${e}`);
    }
    this.logger.log(`Fin de l'import`);
    return true;
  }

  /**
   * Check that the Excel columns match the expected pattern
   * @param worksheet
   * @param row
   * @private
   */
  private checkColumns(worksheet: ExcelJS.Worksheet, row: any[]): boolean {
    for (let columnId = 0; columnId < OrderedColumnNames.length; columnId++) {
      if (
        OrderedColumnNames[columnId].trim() !==
        String(row[columnId] ?? '').trim()
      ) {
        const columnExcel = worksheet.getColumn(columnId + 1).letter;
        throw new Error(
          `<strong>Erreur rencontrée dans le fichier Excel :</strong><br>
          La colonne <em>${columnExcel}</em> devrait être "<strong>${OrderedColumnNames[columnId]}</strong>" et non "<strong>${row[columnId]}</strong>"<br><br>
          <strong>Les colonnes attendues sont :</strong> <pre>${OrderedColumnNames}</pre><br>
          <strong>Les colonnes données sont   :</strong> <pre>${row}</pre><br><br>

          Merci de la corriger avant de retenter un import.`
        );
      }
    }
    return true;
  }

  /**
   * Create "axe", "sous-axe", and "sous-sous-axe"
   * Add the "fiche" from rowData in the good "axe"
   * @param rowData
   * @param plan
   * @param memory
   * @private
   */
  private async createAxes(
    rowData: any[],
    plan: PlanImport,
    memory: MemoryImport
  ): Promise<void> {
    const axeNames = [
      this.clean.text(rowData[columnIndexes[ColumnNames.Axe]], true),
      this.clean.text(rowData[columnIndexes[ColumnNames.SousAxe]], true),
      this.clean.text(rowData[columnIndexes[ColumnNames.SousSousAxe]], true),
    ];

    let parent = plan;
    let currentAxe: AxeImport | undefined = undefined;

    for (const axeName of axeNames) {
      if (!axeName) continue;
      currentAxe = this.getOrCreateAxe(axeName, parent, memory.axes);
      parent.enfants.add(currentAxe);
      parent = currentAxe;
    }

    const axeFiche = currentAxe ?? plan;
    const fiche = await this.createFiche(rowData, memory);
    if (fiche) {
      axeFiche.fiches.push(fiche);
      memory.fiches.add(fiche);
    }
  }

  /**
   * Get an existing axe with the same name or create a new one
   * @param nom
   * @param parent
   * @param existingAxes
   * @private
   */
  private getOrCreateAxe(
    nom: string,
    parent: AxeImport | PlanImport,
    existingAxes: Set<AxeImport>
  ): AxeImport {
    // Get an existing "axe" given its name and parent
    for (const existingAxe of existingAxes) {
      if (existingAxe.nom === nom && existingAxe.parent === parent) {
        return existingAxe;
      }
    }

    // If there is no "axe", create a new one
    const newAxe: AxeImport = {
      nom,
      parent,
      enfants: new Set<AxeImport>(),
      fiches: [],
    };

    existingAxes.add(newAxe); // Add the new "axe"
    return newAxe;
  }

  /**
   * Create a "fiche"
   * @param rowData
   * @param memory
   * @private
   */
  private async createFiche(
    rowData: any[],
    memory: MemoryImport
  ): Promise<FicheImport | null> {
    const title = this.clean.text(
      rowData[columnIndexes[ColumnNames.TitreFicheAction]],
      true
    );
    if (!title || title.includes('Champ obligatoire')) {
      return null;
    }
    const toReturn = {
      titre: title,
      description: this.clean.text(
        rowData[columnIndexes[ColumnNames.Descriptif]]
      ),
      gouvernance: this.clean.text(
        rowData[columnIndexes[ColumnNames.InstancesGouvernance]]
      ),
      objectifs: this.clean.text(rowData[columnIndexes[ColumnNames.Objectifs]]),
      indicateurs: undefined, // unavailable
      structures: this.clean.tags(
        rowData[columnIndexes[ColumnNames.StructurePilote]],
        TagEnum.Structure,
        memory.tags
      ),
      resources: this.clean.text(
        rowData[columnIndexes[ColumnNames.MoyensHumainsTechniques]]
      ),
      partenaires: this.clean.tags(
        rowData[columnIndexes[ColumnNames.Partenaires]],
        TagEnum.Partenaire,
        memory.tags
      ),
      services: this.clean.tags(
        rowData[columnIndexes[ColumnNames.DirectionOuServicePilote]],
        TagEnum.Service,
        memory.tags
      ),
      pilotes: await this.clean.persons(
        rowData[columnIndexes[ColumnNames.PersonnePilote]],
        memory.tags,
        memory.members
      ),
      referents: await this.clean.persons(
        rowData[columnIndexes[ColumnNames.EluReferent]],
        memory.tags,
        memory.members
      ),
      participation: await this.clean.participation(
        rowData[columnIndexes[ColumnNames.ParticipationCitoyenne]]
      ),
      financements: this.clean.text(
        rowData[columnIndexes[ColumnNames.Financements]]
      ),
      financeurs: this.createFinanceur(rowData, memory.tags),
      budget: this.clean.int(
        rowData[columnIndexes[ColumnNames.BudgetPrevisionnel]]
      ),
      statut: await this.clean.statut(
        rowData[columnIndexes[ColumnNames.Statut]]
      ),
      priorite: await this.clean.priorite(
        rowData[columnIndexes[ColumnNames.NiveauPriorite]]
      ),
      dateDebut: this.clean.date(rowData[columnIndexes[ColumnNames.DateDebut]]),
      dateFin: this.clean.date(rowData[columnIndexes[ColumnNames.DateFin]]),
      ameliorationContinue: this.clean.boolean(
        rowData[columnIndexes[ColumnNames.ActionAmeliorationContinue]]
      ),
      calendrier: this.clean.text(
        rowData[columnIndexes[ColumnNames.Calendrier]]
      ),
      actions: undefined, // unavailable
      fiches: undefined, // unavailable
      notesSuivi: undefined, // unavailable
      etapes: undefined, // unavailable
      notes: undefined, // unavailable
      annexes: undefined, // unavailable
    };
    return toReturn;
  }

  /**
   * Create "financeur" tags and the associated "montant"
   * @param rowData
   * @param existingTags
   * @private
   */
  private createFinanceur(
    rowData: any[],
    existingTags: Set<TagImport>
  ): FinanceurImport[] {
    const toReturn: FinanceurImport[] = [];
    const financeursIndex: number[] = [];
    const f1index = columnIndexes[ColumnNames.Financeur1];
    if (f1index) financeursIndex.push(f1index);
    const f2index = columnIndexes[ColumnNames.Financeur2];
    if (f2index) financeursIndex.push(f2index);
    const f3index = columnIndexes[ColumnNames.Financeur3];
    if (f3index) financeursIndex.push(f3index);

    for (const index of financeursIndex) {
      const tag: TagImport[] | undefined = this.clean.tags(
        rowData[index],
        TagEnum.Financeur,
        existingTags
      );
      // The three column "Montant € HT" have the same name
      // so we can't use columnIndexes[ColumnNames.MontantX]
      const montant: number | undefined = this.clean.int(rowData[index + 1]);
      if (tag && tag.length == 1 && montant) {
        const financeur: FinanceurImport = {
          tag: tag[0],
          montant: montant,
        };
        toReturn.push(financeur);
      }
    }
    return toReturn;
  }

  /**
   * Fetch data
   * @param collectiviteId
   * @private
   */
  private async fetchData(collectiviteId: number): Promise<MemoryImport> {
    const memoryData: MemoryImport = {
      axes: new Set<AxeImport>(),
      tags: new Set<TagImport>(),
      fiches: new Set<FicheImport>(),
      effetsAttendu: await this.fetch.effetsAttendus(),
      members: await this.fetch.members(collectiviteId),
      thematiques: await this.fetch.thematiques(),
      sousThematiques: await this.fetch.sousThematiques(),
    };

    for (const ficheTag of ficheTagTypes) {
      (await this.fetch.tags(collectiviteId, ficheTag as TagType)).forEach(
        (tag) => memoryData.tags.add(tag)
      );
    }

    return memoryData;
  }

  /**
   * Save datas
   * @param collectiviteId
   * @param memoryData
   * @private
   */
  private async saveData(
    collectiviteId: number,
    user: AuthenticatedUser,
    memoryData: MemoryImport,
    plan: PlanImport
  ) {
    // Order is important tags -> fiches -> axes
    await this.databaseService.db.transaction(async (tx) => {
      await this.save.tags(collectiviteId, memoryData.tags, tx);
      await this.save.fiches(collectiviteId, memoryData.fiches, tx, user);
      const planResult = await this.mutatePlanService.mutatePlan(
        {
          collectiviteId,
          ...plan,
        },
        user,
        tx
      );
      if ('error' in planResult) {
        throw new Error(planResult.error);
      }
      for (const axe of memoryData.axes) {
        await this.save.axe(collectiviteId, planResult.data.id, axe, tx);
      }
    });
  }
}
