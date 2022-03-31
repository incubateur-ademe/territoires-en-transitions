import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {TPersonnalisationRegleRead} from 'generated/dataLayer/personnalisation_regle_read';
import {PostgrestResponse} from '@supabase/supabase-js';

export interface PersonnalisationRegleGetParams {
  action_id?: string;
}

// Retourne la liste des règles de personnalisation du potentiel rattachées aux actions
export class PersonnalisationRegleReadEndpoint extends DataLayerReadCachedEndpoint<
  TPersonnalisationRegleRead,
  PersonnalisationRegleGetParams
> {
  readonly name = 'personnalisation_regle';

  async _read(
    getParams: PersonnalisationRegleGetParams
  ): Promise<PostgrestResponse<TPersonnalisationRegleRead>> {
    const {action_id} = getParams;
    if (action_id) {
      return this._table.eq('action_id', action_id);
    }
    return this._table.select();
  }
}

export const personnalisationRegleReadEndpoint =
  new PersonnalisationRegleReadEndpoint([]);
