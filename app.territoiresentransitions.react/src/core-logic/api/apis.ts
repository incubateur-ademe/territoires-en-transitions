import {supabaseClient} from './supabase'
import {CollectiviteEngagee} from '@tet/api'

// @ts-ignore
export const collectiviteEngageeAPI = new CollectiviteEngagee.API(supabaseClient);
