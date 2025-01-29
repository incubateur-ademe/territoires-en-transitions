import { DataLayerReadCachedEndpoint } from '@/app/core-logic/api/dataLayerEndpoint';
import { Referentiel } from '@/app/referentiels/litterals';
import { ActionType } from '@/app/referentiels/referentiels.types';
import { PostgrestResponse } from '@supabase/supabase-js';

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
      // @ts-ignore
      return this._table.eq('referentiel', getParams.referentiel);
    // @ts-ignore
    return this._table;
  }
}

export const actionTitleReadEndpoint = new ActionTitleReadEndpoint([]);
