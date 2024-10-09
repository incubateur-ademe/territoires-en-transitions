import {PanierAPI} from '@tet/api';
import { createClient } from './supabase/client';

export const supabase = createClient();

export const panierAPI = new PanierAPI(supabase);
