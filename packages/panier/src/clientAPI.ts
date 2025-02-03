import { PanierAPI } from '@/api';
import { supabaseClient as supabase } from '@/api/utils/supabase/browser-client';

export const panierAPI = new PanierAPI(supabase);
