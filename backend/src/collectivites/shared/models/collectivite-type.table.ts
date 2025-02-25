import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const collectiviteTypeId = {
  Region: 'region',
  Departement: 'departement',
  EPCI: 'epci',
  Commune: 'commune',
  Test: 'test',
};

export const collectiviteTypeTable = pgTable('collectivite_type', {
  id: serial('id').primaryKey(),
  nom: text('nom').notNull(),
});
