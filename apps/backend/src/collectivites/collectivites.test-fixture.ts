import { eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { DatabaseService } from '../utils/database/database.service';
import { groupementCollectiviteTable } from './shared/models/groupement-collectivite.table';
import {
  CreateGroupementType,
  groupementTable,
} from './shared/models/groupement.table';
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

// ----------

type GroupementAllowedInput = Partial<CreateGroupementType> & {
  collectiviteIds?: number[];
};

export async function createGroupement({
  database,
  groupementData,
}: {
  database: DatabaseService;
  groupementData: GroupementAllowedInput;
}) {
  const groupement = await database.db
    .insert(groupementTable)
    .values({
      nom: groupementData.nom ?? 'fixture groupement nom',
    })
    .returning()
    .then(([g]) => g);

  // Associate collectivites with the groupement if provided
  if (groupementData.collectiviteIds?.length) {
    await database.db.insert(groupementCollectiviteTable).values(
      groupementData.collectiviteIds.map((collectiviteId) => ({
        groupementId: groupement.id,
        collectiviteId,
      }))
    );
  }

  onTestFinished(async () => {
    // Delete groupement (cascade will delete groupement_collectivite associations)
    await database.db
      .delete(groupementTable)
      .where(eq(groupementTable.id, groupement.id));
  });

  return groupement;
}
