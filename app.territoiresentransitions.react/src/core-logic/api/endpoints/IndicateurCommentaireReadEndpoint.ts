import {DataLayerReadEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {IndicateurCommentaireRead} from '../../../generated/dataLayer/indicateur_commentaire_read';

export interface IndicateurCommentaireGetParams {
  collectivite_id: number;
  indicateur_id?: string;
}

class IndicateurCommentaireReadEndpoint extends DataLayerReadEndpoint<
  IndicateurCommentaireRead,
  IndicateurCommentaireGetParams
> {
  readonly name = 'indicateur_commentaire';

  async _read(
    getParams: IndicateurCommentaireGetParams
  ): Promise<PostgrestResponse<IndicateurCommentaireRead>> {
    if (getParams.indicateur_id)
      return this._table
        .eq('collectivite_id', getParams.collectivite_id)
        .eq('indicateur_id', getParams.indicateur_id);
    return this._table.eq('collectivite_id', getParams.collectivite_id);
  }
}

export const indicateurCommentaireReadEndpoint =
  new IndicateurCommentaireReadEndpoint();
