import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {ActionCommentaireRead} from 'generated/dataLayer/action_commentaire_read';
import {PostgrestResponse} from '@supabase/supabase-js';
import {actionCommentaireWriteEndpoint} from 'core-logic/api/endpoints/ActionCommentaireWriteEndpoint';

export interface CommentaireGetParams {
  collectivite_id: number;
  action_id?: string;
}

export class ActionCommentaireReadEndpoint extends DataLayerReadCachedEndpoint<
  ActionCommentaireRead,
  CommentaireGetParams
> {
  readonly name = 'action_commentaire';

  async _read(
    getParams: CommentaireGetParams
  ): Promise<PostgrestResponse<ActionCommentaireRead>> {
    if (getParams.action_id)
      return this._table
        .eq('collectivite_id', getParams.collectivite_id)
        .eq('action_id', getParams.action_id);
    return this._table.eq('collectivite_id', getParams.collectivite_id);
  }
}

export const actionCommentaireReadEndpoint = new ActionCommentaireReadEndpoint([
  actionCommentaireWriteEndpoint,
]);
