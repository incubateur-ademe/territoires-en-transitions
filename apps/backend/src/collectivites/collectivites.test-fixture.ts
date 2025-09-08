import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { DatabaseService } from '../utils';
import {
  categorieTagTable,
  CreateCategorieTag,
} from './tags/categorie-tag.table';
import {
  PersonneTagInsert,
  personneTagTable,
} from './tags/personnes/personne-tag.table';
import { ServiceTagInsert, serviceTagTable } from './tags/service-tag.table';

type PersonneTagAllowedInput = Partial<PersonneTagInsert> &
  Pick<PersonneTagInsert, 'collectiviteId'>;

export async function createPersonneTag({
  database,
  tagData,
}: {
  database: DatabaseService;
  tagData: PersonneTagAllowedInput;
}) {
  const personne = await database.db
    .insert(personneTagTable)
    .values({ ...tagData, nom: tagData.nom ?? 'fixture nom' })
    .returning()
    .then(([tag]) => tag);

  onTestFinished(async () => {
    await database.db
      .delete(personneTagTable)
      .where(eq(personneTagTable.id, personne.id));
  });

  return personne;
}

// ----------

type ServiceTagAllowedInput = Partial<ServiceTagInsert> &
  Pick<ServiceTagInsert, 'collectiviteId'>;

export async function createServiceTag({
  database,
  tagData,
}: {
  database: DatabaseService;
  tagData: ServiceTagAllowedInput;
}) {
  const service = await database.db
    .insert(serviceTagTable)
    .values({ ...tagData, nom: tagData.nom ?? 'fixture service nom' })
    .returning()
    .then(([tag]) => tag);

  onTestFinished(async () => {
    await database.db
      .delete(serviceTagTable)
      .where(eq(serviceTagTable.id, service.id));
  });

  return service;
}

// ----------

type CategorieTagAllowedInput = Partial<CreateCategorieTag> &
  Pick<CreateCategorieTag, 'collectiviteId'>;

export async function createCategorieTag({
  database,
  tagData,
}: {
  database: DatabaseService;
  tagData: CategorieTagAllowedInput;
}) {
  const categorie = await database.db
    .insert(categorieTagTable)
    .values({
      ...tagData,
      nom: tagData.nom ?? 'fixture categorie nom',
    })
    .returning()
    .then(([tag]) => tag);

  onTestFinished(async () => {
    await database.db
      .delete(categorieTagTable)
      .where(eq(categorieTagTable.id, categorie.id));
  });

  return categorie;
}
