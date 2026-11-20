import { createClient } from '@supabase/supabase-js';

const createStorageAdminClient = () => {
  const url = process.env.SUPABASE_API_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      'SUPABASE_API_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
    );
  }
  return createClient(url, key);
};

/**
 * Dépose un objet dans un bucket privé, avec la clé service role, pour qu'une
 * URL signée ou un téléchargement servi par le backend trouve quelque chose.
 * Le bucket est créé s'il n'existe pas encore : certains ne le sont qu'au
 * premier envoi du backend.
 *
 * @returns De quoi retirer l'objet en fin de test.
 */
export const uploadStorageObject = async ({
  bucketId,
  path,
  content,
  contentType,
}: {
  bucketId: string;
  path: string;
  content: Buffer;
  contentType: string;
}): Promise<() => Promise<void>> => {
  const storage = createStorageAdminClient().storage;
  const { error: bucketError } = await storage.createBucket(bucketId, {
    public: false,
  });
  if (bucketError && !/already exists/i.test(bucketError.message)) {
    throw bucketError;
  }
  const { error } = await storage
    .from(bucketId)
    .upload(path, content, { contentType });
  if (error) {
    throw error;
  }
  return async () => {
    await storage.from(bucketId).remove([path]);
  };
};
