import {ActionImpactAPI, PanierAPI} from '@tet/api';
import {createClient} from 'src/supabase/client';

export const supabase = createClient()

// @ts-ignore
export const actionImpactAPI = new ActionImpactAPI(supabase);

// @ts-ignore
export const panierAPI = new PanierAPI(supabase);
