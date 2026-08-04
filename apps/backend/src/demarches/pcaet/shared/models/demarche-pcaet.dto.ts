import { sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import type { PersonneTagOrUser } from '@tet/domain/collectivites';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import type { DemarchePcaet } from '@tet/domain/demarches';
import { SQL, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import {
  demarcheTable,
  type DemarcheRow,
} from '@tet/backend/demarches/shared/models/demarche.table';

export const sqlToNullableDateTimeISO = (
  column: PgColumn
): SQL<string | null> => sql<string | null>`${sqlToDateTimeISO(column)}`;

/**
 * Colonnes de lecture d'une démarche : les timestamps sont sérialisés en ISO
 * 8601 (le format texte natif de Postgres n'est pas parsé par tous les
 * moteurs JS).
 */
export const demarchePcaetSelectColumns = {
  id: demarcheTable.id,
  collectiviteId: demarcheTable.collectiviteId,
  type: demarcheTable.type,
  titre: demarcheTable.titre,
  description: demarcheTable.description,
  status: demarcheTable.status,
  publicationStatus: demarcheTable.publicationStatus,
  obligation: demarcheTable.obligation,
  launchedAt: sqlToNullableDateTimeISO(demarcheTable.launchedAt),
  publishedAt: sqlToNullableDateTimeISO(demarcheTable.publishedAt),
  transmittedAt: sqlToNullableDateTimeISO(demarcheTable.transmittedAt),
  avisDeadlineAt: sqlToNullableDateTimeISO(demarcheTable.avisDeadlineAt),
  planActionId: demarcheTable.planActionId,
  createdAt: sqlToDateTimeISO(demarcheTable.createdAt),
  modifiedAt: sqlToDateTimeISO(demarcheTable.modifiedAt),
};

type DemarchePcaetSelectRow = Omit<DemarcheRow, 'createdBy' | 'modifiedBy'>;

export const toDemarchePcaetDto = (
  row: DemarchePcaetSelectRow,
  pilotes: PersonneTagOrUser[]
): DemarchePcaet => ({
  id: row.id,
  collectiviteId: row.collectiviteId,
  // Discriminant imposé par le mapper du type concret (les lignes viennent
  // d'un WHERE type = 'pcaet').
  type: DemarcheTypeEnum.PCAET,
  titre: row.titre,
  description: row.description,
  status: row.status,
  publicationStatus: row.publicationStatus,
  obligation: row.obligation,
  launchedAt: row.launchedAt,
  publishedAt: row.publishedAt,
  transmittedAt: row.transmittedAt,
  avisDeadlineAt: row.avisDeadlineAt,
  planActionId: row.planActionId,
  pilotes,
  // Rempli par DemarchePcaetGuardsService.enrich (dépend de l'utilisateur).
  availableTransitions: [],
  createdAt: row.createdAt,
  modifiedAt: row.modifiedAt,
});
