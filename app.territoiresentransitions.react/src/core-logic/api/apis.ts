import { CollectiviteEngagee } from '@/api';
import { supabaseClient } from './supabase';

// @ts-ignore
export const collectiviteEngageeAPI = new CollectiviteEngagee.API(
  supabaseClient
);
