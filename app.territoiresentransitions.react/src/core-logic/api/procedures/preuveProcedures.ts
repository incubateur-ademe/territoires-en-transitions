import {supabaseClient} from 'core-logic/api/supabase';

export type FichierPreuveWrite = {
  collectivite_id: number;
  action_id: string;
  filename: string;
  commentaire: string;
};

export const upsertFichierPreuve = async (
  fichierPreuve: FichierPreuveWrite
): Promise<boolean> => {
  const {collectivite_id, action_id, filename, commentaire} = fichierPreuve;
  const {error} = await supabaseClient.rpc('upsert_preuve', {
    collectivite_id,
    action_id,
    filename,
    commentaire,
  });

  if (error) {
    console.error(error);
    return false;
  }
  return true;
};
