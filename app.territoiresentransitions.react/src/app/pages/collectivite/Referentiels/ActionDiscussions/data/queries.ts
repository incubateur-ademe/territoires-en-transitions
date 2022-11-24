import {supabaseClient} from 'core-logic/api/supabase';

type UpsertArgs = {
  collectivite_id: number;
  action_id: string;
};

/** Ajoute une discussion à une action pour une collectivité */
export const upsertActionDiscussion = async ({
  collectivite_id,
  action_id,
}: UpsertArgs) =>
  supabaseClient
    .from('action_discussion')
    .upsert({collectivite_id, action_id})
    .select();

type InsertCommentaireArgs = {
  discussion_id: number;
  message: string;
};

/** Attache un nouveau commentaire à une discussion */
export const insertActionDiscussionCommentaire = async ({
  discussion_id,
  message,
}: InsertCommentaireArgs) =>
  supabaseClient
    .from('action_discussion_commentaire')
    .insert({discussion_id, message});
