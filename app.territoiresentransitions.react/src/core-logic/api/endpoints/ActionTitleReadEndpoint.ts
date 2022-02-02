import {DataLayerReadCachedEndpoint} from 'core-logic/api/dataLayerEndpoint';
import {PostgrestResponse} from '@supabase/supabase-js';
import {Referentiel} from 'types/litterals';
import {ActionType} from 'types/action_referentiel';

export interface ActionTitleGetParams {
  referentiel?: Referentiel;
}

export interface ActionTitleRead {
  id: string;
  referentiel: Referentiel;
  children: string[];
  type: ActionType;
  identifiant: string;
  nom: string;
}

class ActionTitleReadEndpoint extends DataLayerReadCachedEndpoint<
  ActionTitleRead,
  ActionTitleGetParams
> {
  readonly name = 'action_title';

  async _read(
    getParams: ActionTitleGetParams
  ): Promise<PostgrestResponse<ActionTitleRead>> {
    if (getParams.referentiel !== undefined)
      return this._table.eq('referentiel', getParams.referentiel);
    return this._table;
  }
}

export const actionTitleReadEndpoint = new ActionTitleReadEndpoint([]);
