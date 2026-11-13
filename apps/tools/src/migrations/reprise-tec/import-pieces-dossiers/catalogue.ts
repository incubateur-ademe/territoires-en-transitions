/** Le catalogue des pièces attendues de chaque dossier, lu par le produit : seules les pièces qui concernent la collectivité y sont. */

import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import PersonnalisationsExpressionService from '@tet/backend/collectivites/personnalisations/services/personnalisations-expression.service';
import type PersonnalisationsService from '@tet/backend/collectivites/personnalisations/services/personnalisations-service';
import { CollectiviteCommunesMembresRepository } from '@tet/backend/collectivites/shared/collectivite-communes-membres.repository';
import { DemarcheDocumentApplicabiliteService } from '@tet/backend/demarches/shared/demarche-document-applicabilite.service';
import { DemarcheDocumentsRepository } from '@tet/backend/demarches/shared/demarche-documents.repository';
import { DemarcheHistoriqueRepository } from '@tet/backend/demarches/shared/demarche-historique.repository';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  DemarcheTypeEnum,
  type DemarcheDocumentDefinition,
} from '@tet/domain/demarches';
import { Logger } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export type Catalogue = ReadonlyMap<number, DemarcheDocumentDefinition[]>;

/** Le catalogue de chaque dossier ; le repository est créé sans Nest, il ne lit que `.db`. */
export const loadCatalogue = async (
  pool: Pool,
  dossiers: readonly { demarcheId: number; collectiviteId: number }[]
): Promise<Catalogue> => {
  // Le produit journalise et garde la pièce quand une condition ne s'évalue pas (EPT du Grand Paris).
  Logger.overrideLogger(false);
  const database = { db: drizzle(pool) } as unknown as DatabaseService;
  const repository = new DemarcheDocumentsRepository(
    database,
    new DemarcheDocumentApplicabiliteService(
      new CollectivitesService(database),
      new CollectiviteCommunesMembresRepository(database),
      new PersonnalisationsExpressionService(),
      undefined as unknown as PersonnalisationsService,
      new DemarcheHistoriqueRepository(database)
    )
  );

  const catalogue = new Map<number, DemarcheDocumentDefinition[]>();
  for (const { demarcheId, collectiviteId } of dossiers) {
    if (!catalogue.has(demarcheId)) {
      catalogue.set(
        demarcheId,
        await repository.listDefinitions(DemarcheTypeEnum.PCAET, {
          collectiviteId,
          demarcheId,
        })
      );
    }
  }
  return catalogue;
};
