import { INestApplication } from '@nestjs/common';
import { storageObjectTable } from '@tet/backend/collectivites/documents/models/storage-object.table';
import { indicateurSourceMetadonneeTable } from '@tet/backend/indicateurs/shared/models/indicateur-source-metadonnee.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SupabaseService from '@tet/backend/utils/database/supabase.service';
import { eq } from 'drizzle-orm';
import { SNBC3_BUCKET } from './snbc3-release-storage.service';
import { Snbc3SourceMetadonneeRepository } from './snbc3-source-metadonnee.repository';

type SavedObject = {
  name: string;
  content: Buffer;
  mimeType: string | undefined;
  userMetadata: Record<string, string> | undefined;
};

/**
 * Sauvegarde le bucket `trajectoires-snbc3` et la date de la métadonnée
 * `snbc3`, et renvoie de quoi les remettre en l'état.
 *
 * Le bucket et la métadonnée sont ceux de l'app : une spec qui y écrit une
 * release de test remplacerait le classeur et le PDF de méthodologie de
 * l'import réel en local (servis ensuite par la page Trajectoire et les
 * fiches indicateurs).
 *
 * Si la métadonnée n'existait pas, la restauration supprime celle créée par la
 * spec, avec ses valeurs (cascade) : l'appeler après le nettoyage des
 * collectivités de test.
 */
export const backupSnbc3Release = async (
  app: INestApplication
): Promise<() => Promise<void>> => {
  const { db } = app.get(DatabaseService);
  const supabase = app.get(SupabaseService);
  const metadonneeRepository = app.get(Snbc3SourceMetadonneeRepository);

  const listObjects = () =>
    db
      .select({
        name: storageObjectTable.name,
        metadata: storageObjectTable.metadata,
        userMetadata: storageObjectTable.userMetadata,
      })
      .from(storageObjectTable)
      .where(eq(storageObjectTable.bucketId, SNBC3_BUCKET));

  const savedObjects: SavedObject[] = await Promise.all(
    (await listObjects()).map(async ({ name, metadata, userMetadata }) => {
      if (!name) throw new Error('Objet du bucket SNBC 3 sans nom');
      const { data, error } = await supabase.client.storage
        .from(SNBC3_BUCKET)
        .download(name);
      if (error) throw error;
      return {
        name,
        content: Buffer.from(await data.arrayBuffer()),
        mimeType: (metadata as { mimetype?: string } | null)?.mimetype,
        userMetadata: (userMetadata ?? undefined) as
          | Record<string, string>
          | undefined,
      };
    })
  );

  const metadonneeId = await metadonneeRepository.findMetadonneeId();
  const [metadonnee] = metadonneeId
    ? await db
        .select({ dateVersion: indicateurSourceMetadonneeTable.dateVersion })
        .from(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, metadonneeId))
    : [];

  return async () => {
    const savedNames = new Set(savedObjects.map(({ name }) => name));
    const addedNames = (await listObjects())
      .map(({ name }) => name)
      .filter((name): name is string => !!name && !savedNames.has(name));
    if (addedNames.length) {
      const { error } = await supabase.client.storage
        .from(SNBC3_BUCKET)
        .remove(addedNames);
      if (error) throw error;
    }

    for (const { name, content, mimeType, userMetadata } of savedObjects) {
      const saved = await supabase.saveInStorage({
        bucket: SNBC3_BUCKET,
        path: name,
        file: content,
        mimeType,
        metadata: userMetadata,
      });
      if (!saved.success) throw new Error(saved.error);
    }

    if (metadonneeId && metadonnee) {
      await metadonneeRepository.updateMetadonnee(metadonneeId, metadonnee);
      return;
    }

    // Métadonnée créée par la spec : appelé après le nettoyage de ses valeurs,
    // pour ne pas laisser en base une métadonnée sans import réel derrière.
    const createdId = await metadonneeRepository.findMetadonneeId();
    if (createdId !== null) {
      await db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, createdId));
    }
  };
};
