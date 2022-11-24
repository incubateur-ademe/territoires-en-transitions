import {DataLayerWriteEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {IndicateurCommentaireWrite} from 'generated/dataLayer/indicateur_commentaire_write';
import {PostgrestResponse} from '@supabase/supabase-js';

export class IndicateurCommentaireWriteEndpoint extends DataLayerWriteEndpoint<IndicateurCommentaireWrite> {
  readonly name = 'indicateur_commentaire';

  async _write(
    commentaire: IndicateurCommentaireWrite
  ): Promise<PostgrestResponse<IndicateurCommentaireWrite>> {
    return this._table
      .upsert([commentaire], {
        onConflict: 'collectivite_id,indicateur_id',
      })
      .select();
  }
}

export const indicateurCommentaireWriteEndpoint =
  new IndicateurCommentaireWriteEndpoint();
