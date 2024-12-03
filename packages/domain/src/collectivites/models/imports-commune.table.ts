import { integer, varchar } from "drizzle-orm/pg-core";
import { importsSchema } from "./imports-region.table";

export const importCommuneTable = importsSchema.table('commune', {
    code: varchar('code', { length: 5 }).primaryKey(),
    regionCode: varchar('region_code', { length: 2 }),
    departementCode: varchar('departement_code', { length: 3 }),
    libelle: varchar('libelle', { length: 30 }),
    population: integer('population').notNull(),
  });
  