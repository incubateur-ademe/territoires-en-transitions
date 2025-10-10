import {
  EpciPerimetre,
  epciPerimetreSchema,
} from '@/backend/collectivites/import-collectivite-relations/epci-perimetre.schema';
import { ImportCollectiviteRelationsResponse } from '@/backend/collectivites/import-collectivite-relations/import-collectivite-relations.response';
import {
  SyndicatEpci,
  syndicatEpciSchema,
} from '@/backend/collectivites/import-collectivite-relations/syndicat-epci.schema';
import ListCollectivitesService, {
  MIN_COMMUNE_POPULATION,
} from '@/backend/collectivites/list-collectivites/list-collectivites.service';
import {
  CollectiviteRelationsInsert,
  collectiviteRelationsTable,
} from '@/backend/collectivites/shared/models/collectivite-relations.table';
import { DatabaseService } from '@/backend/utils';
import { CsvService } from '@/backend/utils/csv/csv.service';
import { getErrorMessage } from '@/backend/utils/get-error-message';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { chunk } from 'es-toolkit';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class ImportCollectiviteRelationsService {
  private readonly logger = new Logger(ImportCollectiviteRelationsService.name);

  private readonly RELATIONS_EPCI_COMMUNES_URL =
    'https://www.data.gouv.fr/api/1/datasets/r/6e05c448-62cc-4470-aa0f-4f31adea0bc4';

  private readonly RELATIONS_BULK_INSERT_BATCH_SIZE = 1000;

  constructor(
    private readonly database: DatabaseService,
    private readonly collectiviteService: ListCollectivitesService,
    private readonly csvService: CsvService
  ) {}

  /**
   * Import collectivite relations from CSV data
   * @param csvData The CSV data as a string
   */
  private async importEpciCommunesRelationsFromCsvData(
    csvData: string
  ): Promise<ImportCollectiviteRelationsResponse> {
    this.logger.log('Starting import of EPCI-Communes relations from CSV');

    const results = {
      processed: 0,
      created: 0,
      errors: [] as string[],
    };

    // Get all existing collectivites to map SIREN to ID
    const existingCollectivites =
      await this.collectiviteService.listCollectivites({
        limit: -1,
        page: 1,
      });

    // Create maps for quick lookup
    const sirenToIdMap = new Map<string, number>();
    const communeCodeToIdMap = new Map<string, number>();

    existingCollectivites.data.forEach((collectivite) => {
      if (collectivite.siren) {
        sirenToIdMap.set(collectivite.siren, collectivite.id);
      }
      if (collectivite.communeCode) {
        communeCodeToIdMap.set(collectivite.communeCode, collectivite.id);
      }
    });

    this.logger.log(
      `Found ${existingCollectivites.data.length} existing collectivites`
    );

    // Parse CSV data using the new CSV service
    const relations: CollectiviteRelationsInsert[] = [];
    const processedEpcIs = new Set<string>();

    const csvRelationsResult =
      await this.csvService.getDataFromCsvContent<EpciPerimetre>(csvData, {
        schema: epciPerimetreSchema,
      });

    // Merge CSV parsing errors with our results
    results.processed = csvRelationsResult.processed;
    results.errors.push(...csvRelationsResult.errors);

    this.logger.log(`Parsed ${csvRelationsResult.processed} relations`);

    csvRelationsResult.data.forEach((parsedRow) => {
      // Find the EPCI collectivite
      const epciId = sirenToIdMap.get(parsedRow.siren);
      if (!epciId) {
        results.errors.push(
          `EPCI with SIREN ${parsedRow.siren} (pop: ${parsedRow.total_pop_mun}) not found in database`
        );
        return;
      }

      // Ignore too small communes
      if (parsedRow.pmun_2025 && parsedRow.pmun_2025 < MIN_COMMUNE_POPULATION) {
        return;
      }

      // Find the commune collectivite
      const communeId = communeCodeToIdMap.get(parsedRow.insee);
      if (!communeId) {
        results.errors.push(
          `Commune with INSEE code ${parsedRow.insee} (pop: ${parsedRow.pmun_2025}) not found in database`
        );
        return;
      }

      // Create the relation (commune -> EPCI)
      relations.push({
        id: communeId, // commune
        parentId: epciId, // EPCI
      });

      processedEpcIs.add(parsedRow.siren);
    });

    this.logger.log(`Parsed ${relations.length} relations to create`);

    if (relations.length === 0) {
      this.logger.warn('No relations to create');
      return results;
    }

    // Insert relations in batches to avoid memory issues
    const relationsChunks = chunk(
      relations,
      this.RELATIONS_BULK_INSERT_BATCH_SIZE
    );
    let iChunk = 0;
    for (const relationsChunk of relationsChunks) {
      iChunk++;
      this.logger.log(`Inserting chunk ${iChunk} of ${relationsChunks.length}`);

      try {
        await this.database.db
          .insert(collectiviteRelationsTable)
          .values(relationsChunk)
          .onConflictDoNothing();

        results.created += relationsChunk.length;
      } catch (error) {
        this.logger.error(error);
        throw new InternalServerErrorException(
          `Error inserting chunk ${iChunk}: ${getErrorMessage(error)}`
        );
      }
    }

    this.logger.log(
      `Import completed: ${results.created} relations created, ${results.errors.length} errors`
    );
    return results;
  }

  /**
   * Import collectivite relations from a URL
   * @param url The URL to fetch the CSV data from
   */
  private async importEpciCommunesRelationsFromUrl(): Promise<ImportCollectiviteRelationsResponse> {
    this.logger.log(
      `Fetching CSV data from ${this.RELATIONS_EPCI_COMMUNES_URL}`
    );

    try {
      const response = await fetch(this.RELATIONS_EPCI_COMMUNES_URL);
      if (!response.ok) {
        throw new UnprocessableEntityException(
          `Failed to fetch CSV data: ${response.status} ${response.statusText}`
        );
      }

      const csvData = await response.text();
      return this.importEpciCommunesRelationsFromCsvData(csvData);
    } catch (error: unknown) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        `Error fetching CSV data for epci commune relations: ${getErrorMessage(
          error
        )}`
      );
    }
  }

  private async importEpciCommunesRelationsFromLocalFile(): Promise<ImportCollectiviteRelationsResponse> {
    this.logger.log(
      'Starting import of EPCI-Communes relations from local CSV file'
    );

    try {
      // Read the local CSV file
      const csvFilePath = join(__dirname, 'perimetre-epci-a-fp.csv');
      const csvData = readFileSync(csvFilePath, 'utf-8');

      this.logger.log(`Read CSV file from ${csvFilePath}`);

      return this.importEpciCommunesRelationsFromCsvData(csvData);
    } catch (error: unknown) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        `Error reading local CSV file for EPCI-Communes relations: ${getErrorMessage(
          error
        )}`
      );
    }
  }

  async importEpciCommunesRelations(
    useDatagouvFile?: boolean
  ): Promise<ImportCollectiviteRelationsResponse> {
    if (useDatagouvFile) {
      return this.importEpciCommunesRelationsFromUrl();
    }

    return this.importEpciCommunesRelationsFromLocalFile();
  }

  /**
   * Import syndicat EPCI relations from CSV data
   * @param csvData The CSV data as a string
   */
  private async importSyndicatEpciRelationsFromCsvData(
    csvData: string
  ): Promise<ImportCollectiviteRelationsResponse> {
    this.logger.log('Starting import of Syndicat-EPCI relations from CSV');

    const results = {
      processed: 0,
      created: 0,
      errors: [] as string[],
    };

    // Get all existing collectivites to map SIREN to ID
    const existingCollectivites =
      await this.collectiviteService.listCollectivites({
        limit: -1,
        page: 1,
      });

    // Create maps for quick lookup
    const sirenToIdMap = new Map<string, number>();

    existingCollectivites.data.forEach((collectivite) => {
      if (collectivite.siren) {
        sirenToIdMap.set(collectivite.siren, collectivite.id);
      }
    });

    this.logger.log(
      `Found ${existingCollectivites.data.length} existing collectivites`
    );

    // Parse CSV data using the new CSV service
    const relations: CollectiviteRelationsInsert[] = [];
    const processedSyndicats = new Set<string>();

    const csvRelationsResult =
      await this.csvService.getDataFromCsvContent<SyndicatEpci>(csvData, {
        schema: syndicatEpciSchema,
        parseOptions: {
          delimiter: ',',
          columns: true,
          skip_empty_lines: true,
        },
      });

    // Merge CSV parsing errors with our results
    results.processed = csvRelationsResult.processed;
    results.errors.push(...csvRelationsResult.errors);

    this.logger.log(`Parsed ${csvRelationsResult.processed} relations`);

    csvRelationsResult.data.forEach((parsedRow) => {
      if (parsedRow.type_membre !== 'Groupement') {
        // Ignoring non-groupement members > e.g. Syndicat départemental > commune
        return;
      }

      // Find the syndicat collectivite
      const syndicatId = sirenToIdMap.get(parsedRow.siren);
      if (!syndicatId) {
        results.errors.push(
          `Syndicat with SIREN ${parsedRow.siren} (${parsedRow.raison_sociale}) not found in database`
        );
        return;
      }

      // Find the EPCI member collectivite
      const epciId = sirenToIdMap.get(parsedRow.siren_membre);
      if (!epciId) {
        results.errors.push(
          `EPCI member with SIREN ${parsedRow.siren_membre} (${parsedRow.nom_membre}) not found in database`
        );
        return;
      }

      // Create the relation (EPCI -> Syndicat)
      relations.push({
        id: epciId, // EPCI
        parentId: syndicatId, // Syndicat
      });

      processedSyndicats.add(parsedRow.siren);
    });

    this.logger.log(`Parsed ${relations.length} relations to create`);

    if (relations.length === 0) {
      this.logger.warn('No relations to create');
      return results;
    }

    // Insert relations in batches to avoid memory issues
    const relationsChunks = chunk(
      relations,
      this.RELATIONS_BULK_INSERT_BATCH_SIZE
    );
    let iChunk = 0;
    for (const relationsChunk of relationsChunks) {
      iChunk++;
      this.logger.log(`Inserting chunk ${iChunk} of ${relationsChunks.length}`);

      try {
        await this.database.db
          .insert(collectiviteRelationsTable)
          .values(relationsChunk)
          .onConflictDoNothing();

        results.created += relationsChunk.length;
      } catch (error) {
        this.logger.error(error);
        throw new InternalServerErrorException(
          `Error inserting chunk ${iChunk}: ${getErrorMessage(error)}`
        );
      }
    }

    this.logger.log(
      `Import completed: ${results.created} relations created, ${results.errors.length} errors`
    );
    return results;
  }

  /**
   * Import syndicat EPCI relations from local CSV file
   */
  private async importSyndicatEpciRelationsFromLocalFile(): Promise<ImportCollectiviteRelationsResponse> {
    this.logger.log(
      'Starting import of Syndicat-EPCI relations from local CSV file'
    );

    try {
      // Read the local CSV file
      const csvFilePath = join(__dirname, 'perimetres_epci_syndicats.csv');
      const csvData = readFileSync(csvFilePath, 'utf-8');

      this.logger.log(`Read CSV file from ${csvFilePath}`);

      return this.importSyndicatEpciRelationsFromCsvData(csvData);
    } catch (error: unknown) {
      this.logger.error(error);
      throw new InternalServerErrorException(
        `Error reading local CSV file for syndicat EPCI relations: ${getErrorMessage(
          error
        )}`
      );
    }
  }

  async importSyndicatEpciRelations(
    useDatagouvFile?: boolean
  ): Promise<ImportCollectiviteRelationsResponse> {
    if (useDatagouvFile) {
      // File is not published anymore
      // We need to use the xlsx from banatic available here: https://www.banatic.interieur.gouv.fr/api/export/pregenere/telecharger/France
      // But also here: https://www.data.gouv.fr/datasets/base-nationale-sur-les-intercommunalites/#/resources/348cc004-22b4-4b12-9281-b00d4ccb1d88, https://www.data.gouv.fr/api/1/datasets/r/348cc004-22b4-4b12-9281-b00d4ccb1d88
      // but this file contains all the relations and the commune are not identified by their insee code but by their siren
      throw new NotImplementedException(
        'Importing syndicat EPCI relations from Datagouv file is not implemented, file is not published by datagouv anymore'
      );
    }

    return this.importSyndicatEpciRelationsFromLocalFile();
  }
}
