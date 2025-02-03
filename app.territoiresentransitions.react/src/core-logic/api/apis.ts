import { CollectiviteEngagee } from '@/api';
import { supabaseClient } from '@/api/utils/supabase/browser-client';

// @ts-ignore
export const collectiviteEngageeAPI = new CollectiviteEngagee.API(
  supabaseClient
);
