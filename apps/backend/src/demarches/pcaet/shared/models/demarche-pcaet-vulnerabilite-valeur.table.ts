import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import {
  createdAt,
  createdBy,
  modifiedAt,
  modifiedBy,
} from '@tet/backend/utils/column.utils';
import type { DemarchePcaetVulnerabiliteNiveau } from '@tet/domain/demarches';
import { integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core';
import { demarchePcaetVulnerabiliteThematiqueTable } from './demarche-pcaet-vulnerabilite-thematique.table';

/**
 * Diagnostic de vulnérabilité d'une démarche pour une thématique. Une ligne absente
 * vaut thématique non renseignée, et un niveau nul est une absence de saisie :
 * `non_concerne` est un choix explicite de la collectivité.
 */
export const demarchePcaetVulnerabiliteValeurTable = pgTable(
  'demarche_pcaet_vulnerabilite_valeur',
  {
    demarcheId: integer('demarche_id')
      .notNull()
      .references(() => demarcheTable.id, { onDelete: 'cascade' }),
    thematiqueId: integer('thematique_id')
      .notNull()
      .references(() => demarchePcaetVulnerabiliteThematiqueTable.id, {
        onDelete: 'cascade',
      }),
    /** Niveau correspondant à la situation actuelle du territoire. */
    niveauMaintenant:
      text('niveau_maintenant').$type<DemarchePcaetVulnerabiliteNiveau>(),
    niveau2050: text('niveau_2050').$type<DemarchePcaetVulnerabiliteNiveau>(),
    niveau2100: text('niveau_2100').$type<DemarchePcaetVulnerabiliteNiveau>(),
    /** Non exigés quand le niveau de l'horizon est « non concerné ». */
    objectifs2050: text('objectifs_2050'),
    objectifs2100: text('objectifs_2100'),
    createdAt,
    createdBy,
    modifiedAt,
    modifiedBy,
  },
  (table) => [primaryKey({ columns: [table.demarcheId, table.thematiqueId] })]
);
