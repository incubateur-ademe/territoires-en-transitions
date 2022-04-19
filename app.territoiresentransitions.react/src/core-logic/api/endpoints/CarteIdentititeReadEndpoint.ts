import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {CarteIdentiteRead} from 'generated/dataLayer/carte_identite_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface CarteIdentiteGetParams {
  collectivite_id: number;
}

// retourne la liste des réponses d'une collectivité pour une action donnée
export class CarteIdentititeReadEndpoint extends DataLayerReadCachedEndpoint<
  CarteIdentiteRead,
  CarteIdentiteGetParams
> {
  readonly name = 'collectivite_carte_identite';

  async _read(
    getParams: CarteIdentiteGetParams
  ): Promise<PostgrestResponse<CarteIdentiteRead>> {
    const {collectivite_id} = getParams;

    return this._table.eq('collectivite_id', collectivite_id);
  }
}

export const carteIdentiteReadEndpoint = new CarteIdentititeReadEndpoint([]);
